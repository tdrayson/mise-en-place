use futures_util::StreamExt;
use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::model::LlamaModel;
use llama_cpp_2::sampling::LlamaSampler;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Emitter, State};

const MODEL_URL: &str = "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf";
const MODEL_FILENAME: &str = "Llama-3.2-3B-Instruct-Q4_K_M.gguf";

const SYSTEM_PROMPT: &str = r#"Extract cooking items from the user's text. Return a JSON object with an "items" array.

Each item has: "name" (lowercase string), "cookingMinutes" (number), "method" (one of: "Oven", "Air fryer", "Microwave", "Hob", "Grill"), "temperature" (string or ""), "notes" (string or "").

For a range like "35-40 minutes", use the middle value. Only return food items, not preheat steps.

Example input: "roast potatoes 40 min oven 200C, chicken breast 25 min oven, peas 3 min microwave"

Example output:
{"items":[{"name":"roast potatoes","cookingMinutes":40,"method":"Oven","temperature":"200C","notes":""},{"name":"chicken breast","cookingMinutes":25,"method":"Oven","temperature":"200C","notes":""},{"name":"peas","cookingMinutes":3,"method":"Microwave","temperature":"","notes":""}]}"#;

struct AppState {
    backend: LlamaBackend,
    model: Mutex<Option<LlamaModel>>,
}

fn model_dir() -> PathBuf {
    let base = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("mise-en-place")
}

fn model_path() -> PathBuf {
    model_dir().join(MODEL_FILENAME)
}

#[tauri::command]
fn model_status() -> String {
    if model_path().exists() {
        "ready".to_string()
    } else {
        "missing".to_string()
    }
}

#[derive(Clone, Serialize)]
struct DownloadProgress {
    downloaded: u64,
    total: Option<u64>,
}

#[tauri::command]
async fn download_model(app: tauri::AppHandle) -> Result<(), String> {
    let path = model_path();
    if path.exists() {
        return Ok(());
    }

    let dir = model_dir();
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| format!("Failed to create model directory: {e}"))?;

    let tmp_path = dir.join(format!("{MODEL_FILENAME}.tmp"));

    let response = reqwest::get(MODEL_URL)
        .await
        .map_err(|e| format!("Download failed: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("Download failed with status: {}", response.status()));
    }

    let total = response.content_length();
    let mut stream = response.bytes_stream();
    let mut file = tokio::fs::File::create(&tmp_path)
        .await
        .map_err(|e| format!("Failed to create file: {e}"))?;

    let mut downloaded: u64 = 0;

    use tokio::io::AsyncWriteExt;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download error: {e}"))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Write error: {e}"))?;
        downloaded += chunk.len() as u64;

        let _ = app.emit("download-progress", DownloadProgress { downloaded, total });
    }

    file.flush().await.map_err(|e| format!("Flush error: {e}"))?;
    drop(file);

    tokio::fs::rename(&tmp_path, &path)
        .await
        .map_err(|e| format!("Failed to move model file: {e}"))?;

    Ok(())
}

#[tauri::command]
fn load_model(state: State<'_, AppState>) -> Result<(), String> {
    let path = model_path();
    if !path.exists() {
        return Err("Model not downloaded".to_string());
    }

    let mut model_lock = state.model.lock().map_err(|e| e.to_string())?;
    if model_lock.is_some() {
        return Ok(());
    }

    let params = LlamaModelParams::default();

    let model = LlamaModel::load_from_file(&state.backend, path, &params)
        .map_err(|e| format!("Failed to load model: {e}"))?;

    *model_lock = Some(model);
    Ok(())
}

#[derive(Deserialize)]
struct CookingItem {
    name: String,
    #[serde(alias = "cookingMinutes")]
    cooking_minutes: f64,
    method: String,
    temperature: String,
    notes: String,
}

#[derive(Serialize)]
struct CookingItemOut {
    name: String,
    #[serde(rename = "cookingMinutes")]
    cooking_minutes: f64,
    method: String,
    temperature: String,
    notes: String,
}

#[derive(Deserialize)]
struct AiResponse {
    items: Vec<CookingItem>,
}

#[tauri::command]
fn analyse_input(input: String, state: State<'_, AppState>) -> Result<Vec<CookingItemOut>, String> {
    let model_lock = state.model.lock().map_err(|e| e.to_string())?;
    let model = model_lock.as_ref().ok_or("Model not loaded")?;

    let prompt = format!(
        "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{SYSTEM_PROMPT}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{input}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
    );

    let ctx_params = LlamaContextParams::default()
        .with_n_ctx(std::num::NonZeroU32::new(2048));
    let mut ctx = model
        .new_context(&state.backend, ctx_params)
        .map_err(|e| format!("Context error: {e}"))?;

    let tokens = model
        .str_to_token(&prompt, llama_cpp_2::model::AddBos::Never)
        .map_err(|e| format!("Tokenize error: {e}"))?;

    let mut batch = LlamaBatch::new(2048, 1);

    for (i, token) in tokens.iter().enumerate() {
        let is_last = i == tokens.len() - 1;
        batch.add(*token, i as i32, &[0], is_last).map_err(|e| format!("Batch error: {e}"))?;
    }

    ctx.decode(&mut batch).map_err(|e| format!("Decode error: {e}"))?;

    let mut output_tokens = Vec::new();
    let mut n_cur = tokens.len();
    let max_tokens = 1000;

    let mut sampler = LlamaSampler::chain_simple([
        LlamaSampler::temp(0.1),
        LlamaSampler::dist(42),
    ]);

    for _ in 0..max_tokens {
        let token = sampler.sample(&ctx, batch.n_tokens() - 1);

        if model.is_eog_token(token) {
            break;
        }

        output_tokens.push(token);

        batch.clear();
        batch.add(token, n_cur as i32, &[0], true).map_err(|e| format!("Batch error: {e}"))?;
        n_cur += 1;

        ctx.decode(&mut batch).map_err(|e| format!("Decode error: {e}"))?;
    }

    let response_bytes: Vec<u8> = output_tokens
        .iter()
        .map(|t| model.token_to_piece_bytes(*t, 32, true, None))
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Detokenize error: {e}"))?
        .into_iter()
        .flatten()
        .collect();
    let response_text = String::from_utf8_lossy(&response_bytes).to_string();

    log::info!("Model raw output: {}", response_text);

    // Try to find JSON in the response
    let json_str = response_text
        .find('{')
        .and_then(|start| {
            response_text.rfind('}').map(|end| &response_text[start..=end])
        })
        .ok_or_else(|| format!("No JSON found in model output: {response_text}"))?;

    let parsed: AiResponse = serde_json::from_str(json_str)
        .map_err(|e| format!("JSON parse error: {e}\nRaw output: {response_text}"))?;

    if parsed.items.is_empty() {
        return Err("No items found in response".to_string());
    }

    Ok(parsed
        .items
        .into_iter()
        .map(|item| CookingItemOut {
            name: item.name,
            cooking_minutes: item.cooking_minutes,
            method: item.method,
            temperature: item.temperature,
            notes: item.notes,
        })
        .collect())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let backend = LlamaBackend::init().expect("Failed to init llama backend");

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            backend,
            model: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            model_status,
            download_model,
            load_model,
            analyse_input,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
