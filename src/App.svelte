<script>
  import { onMount } from "svelte";

  // UI state
  let templates = [];
  let selected = { name: "" };
  let isCustom = false;
  let dropped = [];
  let processing = false;
  let msgs = [];

  // Custom fields
  let customName = "";
  let color = "black";
  let size = "1280x720";
  let audioExt = "mp3";
  let outputFolder = "output_videos";

  // 1️⃣ onMount → fetch templates via IPC
  onMount(async () => {
    try {
      const tpls = await window.electronAPI.getTemplates();
      templates = [...tpls, { name: "Custom...", custom: true }];
      selected = templates[0];
      isCustom = false;
    } catch (err) {
      console.error("❌ [App] error loading templates:", err);
    }
  });

  // 2️⃣ Dropdown change handler
  function chooseTpl(event) {
    const name = event.target.value;
    const tpl = templates.find((t) => t.name === name);
    selected = tpl;
    isCustom = tpl.custom === true;
  }

  // 3️⃣ Convert function (uses `selected` or custom fields)
  async function convert() {
    const tpl = isCustom
      ? { name: customName, color, size, audioExt, outputFolder }
      : selected;

    processing = true;
    msgs = [];

    try {
      const results = await window.electronAPI.convertFiles(dropped, tpl);
      msgs = results.map((r) =>
        r.success ? `✅ ${r.file}` : `❌ ${r.file}: ${r.error}`,
      );
      dropped = []
    } catch (err) {
      console.error("⚠️ [App] conversion error:", err);
      msgs = [`❌ Unexpected error: ${err.message}`];
    }

    processing = false;
  }
</script>

<!-- File Drop Area -->
<div
  class="dropzone"
  on:drop|preventDefault={(e) =>
    (dropped = Array.from(e.dataTransfer.files).map((f) => f.path))}
  on:dragover|preventDefault
>
  {#if dropped.length}
    <h4>{dropped.length} audio files ready to convert</h4>
  {:else if msgs.length}
    <h4>Files converted!</h4>
    <p>Drag more audio files to keep on convertin'.</p>
  {:else}
    <h4>Drag & drop audio files here to get convertin'.</h4>
  {/if}
</div>



<div class="main-functionality">
<!-- Template Selector -->
{#if templates.length}
  <div class="form-element">
    <label for="tpl">Template:</label>
    <select id="tpl" on:change={chooseTpl} bind:value={selected.name}>
      {#each templates as tpl}
        <option value={tpl.name}>{tpl.name}</option>
      {/each}
    </select>
  </div>
{:else}
  <p><em>No templates loaded yet.</em></p>
{/if}

<div class="spacer" />

<!-- Custom Template Form -->
{#if isCustom}
  <div class="parameters">
    <div class="form-element">
      <label>Name</label>
      <input placeholder="Name" bind:value={customName} />
    </div>
    <div class="form-element">
      <label>Background Color</label>
      <p>Use color names like "black" or hex like '#121412'</p>
      <input placeholder="Background" bind:value={color} />
    </div>
    <div class="form-element">
      <label>Size</label>
      <p>Must be formatted thusly: "WxH"</p>
      <input placeholder="Size" bind:value={size} />
    </div>
    <div class="form-element">
      <label>Audio File Type</label>
      <p>Use the file extension of your input file (ex. "mp3 or wav")</p>
      <input placeholder="Audio Ext" bind:value={audioExt} />
    </div>
    <div class="form-element">
      <label>Output Folder Name</label>
      <input placeholder="Output Folder" bind:value={outputFolder} />
    </div>

    <button
      on:click={async () => {
        // save & reload
        templates = await window.electronAPI.saveTemplate({
          name: customName,
          color,
          size,
          audioExt,
          outputFolder,
        });
        templates.push({ name: "Custom...", custom: true });
        selected = templates.find((t) => t.name === customName);
        isCustom = false;
      }}
      disabled={!customName}
    >
      Save Template
    </button>
  </div>
{:else}
  <div class="parameters">
    <div class="form-element">
      <label>Background Color</label>
      <p>Use color names like "black" or hex like "#121412"</p>
      <input bind:value={selected.color} />
    </div>
    <div class="form-element">
      <label>Size</label>
      <p>Must be formatted thusly: "WxH"</p>
      <input bind:value={selected.size} />
    </div>
    <div class="form-element">
      <label>Audio File Type</label>
      <p>Use the file extension of your input files (ex. "mp3 or wav")</p>
      <input bind:value={selected.audioExt} />
    </div>
    <div class="form-element">
      <label>Output Folder Name</label>
      <input bind:value={selected.outputFolder} />
    </div>
  </div>
{/if}

<!-- Convert Button -->
<button class="convert-button" on:click={convert} disabled={processing || !dropped.length}>
  {processing ? "Processing…" : "Convert to MP4"}
</button>

</div>

<!-- Results -->
<!-- {#if msgs.length}
  <h4>Results:</h4>
  <ul>
    {#each msgs as m}<li>{m}</li>{/each}
  </ul>
{/if} -->

<style>
  
  :global(body) {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 16px;
    margin: 1rem;
    justify-content: center;
    height: calc(100vh - 2rem);
    display: flex;
    align-items: center;
  }

  :global(body #app) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  :global(p) {
    margin: 0;
  }
  .dropzone {
    border: 2px dashed #ccc;
    padding: 1rem;
    text-align: center;
    border-radius: 4px;
    min-width: 334px;
    width: 100%;
  }

  .spacer {
    height: 1px;
    background-color: #464646;
    margin: 1rem 0;
  }

  .main-functionality {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 400px;
  }

  .parameters {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .form-element input, .form-element select {
    display: block;
    padding: 0.5rem;

  }

  .form-element {
    display: flex;
    flex-direction: column;
    gap: 0.33rem;
  }
  .form-element p {
    font-size: 0.75rem;
    color: #464646;
  }

  .form-element label {
    font-size: 1rem;
  }

  .convert-button {
    padding: 0.75rem;
    background-color: #0033FF;
    color: #fff;
    border: none; 
    border-radius: 4px;
    cursor: pointer;
    margin-top: 0.5rem;
  }

  .convert-button:disabled {
    background-color: gray;
    cursor: not-allowed;
  }

</style>
