<script>
  import { onMount } from "svelte";
  let templates = [];
  let selectedTemplate;
  let droppedFiles = [];
  let messages = [];
  let isProcessing = false;

  onMount(async () => {
    templates = await fetch("templates/templates.json").then((r) => r.json());
    selectedTemplate = templates[0];
  });

  function handleDrop(event) {
    event.preventDefault();
    droppedFiles = Array.from(event.dataTransfer.files).map((f) => f.path);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  async function convert() {
    if (!droppedFiles.length) return;
    isProcessing = true;
    messages = [];
    const results = await window.electronAPI.convertFiles(
      droppedFiles,
      selectedTemplate,
    );
    messages = results.map((r) =>
      r.success ? `✅ ${r.file}` : `❌ ${r.file}: ${r.error}`,
    );
    isProcessing = false;
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="dropzone" on:drop={handleDrop} on:dragover={handleDragOver}>
  {#if droppedFiles.length}
    <h4>Dropped Files:</h4>
    <ul>
      {#each droppedFiles as file}
        <li>{file}</li>
      {/each}
    </ul>
  {:else}
    <p>Drag and drop audio files or folders here</p>
  {/if}
</div>

<label>
  Template:
  <select bind:value={selectedTemplate}>
    {#each templates as t}
      <option value={t}>{t.name}</option>
    {/each}
  </select>
</label>

<button on:click={convert} disabled={isProcessing || !droppedFiles.length}>
  {isProcessing ? "Processing..." : "Convert to MP4"}
</button>

{#if messages.length}
  <h4>Results:</h4>
  <ul>
    {#each messages as msg}
      <li>{msg}</li>
    {/each}
  </ul>
{/if}

<style>
  .dropzone {
    border: 2px dashed #ccc;
    padding: 2em;
    text-align: center;
  }
</style>
