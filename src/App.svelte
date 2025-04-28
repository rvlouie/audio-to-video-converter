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
    console.log("🟢 [App] onMount");
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
    <h4>Dropped Files:</h4>
    <ul>
      {#each dropped as f}<li>{f}</li>{/each}
    </ul>
  {:else}
    <p>Drag & drop files/folders here</p>
  {/if}
</div>

<!-- Template Selector -->
{#if templates.length}
  <div>
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

<!-- Custom Template Form -->
{#if isCustom}
  <div class="custom-form">
    <input placeholder="Name" bind:value={customName} />
    <input placeholder="Background" bind:value={color} />
    <input placeholder="Size" bind:value={size} />
    <input placeholder="Audio Ext" bind:value={audioExt} />
    <input placeholder="Output Folder" bind:value={outputFolder} />
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
  <div>
    <span>{selected.name}</span><span>{selected.color}</span><span
      >{selected.size}</span
    ><span>{selected.outputFolder}</span>
  </div>
{/if}

<!-- Convert Button -->
<button on:click={convert} disabled={processing || !dropped.length}>
  {processing ? "Processing…" : "Convert to MP4"}
</button>

<!-- Results -->
{#if msgs.length}
  <h4>Results:</h4>
  <ul>
    {#each msgs as m}<li>{m}</li>{/each}
  </ul>
{/if}

<style>
  .dropzone {
    border: 2px dashed #ccc;
    padding: 2em;
    text-align: center;
  }
  .custom-form input {
    display: block;
    margin: 0.5em 0;
  }
</style>
