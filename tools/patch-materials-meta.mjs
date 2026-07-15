import fs from 'fs';
import path from 'path';

const cwd = process.cwd();

// Strip inline code payloads from static-data metadata
{
  const p = path.join(cwd, 'src/renderer/modules/materials/static-data.js');
  let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  s = s.replace(/,\s*code:\s*\{[\s\S]*?\}\s*\n\s*\}/g, '\n    }');
  fs.writeFileSync(p, s, 'utf8');
  console.log('patched', p);
}

// Strip inline generateCSS/generateJS from effect presets metadata
{
  const p = path.join(cwd, 'src/renderer/modules/effectline/effect-presets.js');
  let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  s = s.replace(/,\s*generateCSS\([\s\S]*?\}\s*,\s*generateJS\([\s\S]*?\}\s*\n\s*\}/g, '\n  }');
  fs.writeFileSync(p, s, 'utf8');
  console.log('patched', p);
}

// Patch materials UI to be safe without inline code
{
  const p = path.join(cwd, 'src/renderer/modules/materials/materials.js');
  let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

  const loader = `  const _materialCodeCache = new Map();
  async function loadMaterialCode(material) {
    try {
      if (material.code) return material.code;
      if (_materialCodeCache.has(material.id)) {
        material.code = _materialCodeCache.get(material.id);
        return material.code;
      }
      const mod = await import('./materials-code/' + material.id + '.js');
      const code = mod?.default || {};
      _materialCodeCache.set(material.id, code);
      material.code = code;
      return code;
    } catch (e) {
      console.warn('[Materials] load code failed:', material.id, e);
      return {};
    }
  }
  const DEFAULT_PREVIEW_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#0ea5e9','#a855f7'];
`;
  if (!s.includes('const DEFAULT_PREVIEW_COLORS =')) {
    s = s.replace('  let _overlay = null;\n', '  let _overlay = null;\n' + loader);
  }

  if (!s.includes("try { await loadMaterialCode(material); } catch {}")) {
    s = s.replace(
      `    document.getElementById('materialsApply').addEventListener('click', () => {\n      LiveFront.MaterialApply.applyMaterial(material);\n    });`,
      `    document.getElementById('materialsApply').addEventListener('click', async () => {\n      try { await loadMaterialCode(material); } catch {}\n      LiveFront.MaterialApply.applyMaterial(material);\n    });`
    );
    s = s.replace(
      `    document.getElementById('materialsCopy').addEventListener('click', () => {\n      LiveFront.MaterialApply.copyCode(material);\n    });`,
      `    document.getElementById('materialsCopy').addEventListener('click', async () => {\n      try { await loadMaterialCode(material); } catch {}\n      LiveFront.MaterialApply.copyCode(material);\n    });`
    );
  }

  // Make previews resilient when code is not embedded
  s = s.replace("const colors = _getPreviewColors(material.code?.variables);", "const colors = _getPreviewColors(material.code?.variables) || [];");
  s = s.replace("const matches = material.code?.css.match(/#[0-9a-fA-F]{3,8}/g) || [];", "const matches = material.code?.css?.match(/#[0-9a-fA-F]{3,8}/g) || [];");
  s = s.replace(`          return '<div class="materials-preview-colors">' +\n            swatches.map(c =>`, `          if (!swatches.length) swatches.push(...DEFAULT_PREVIEW_COLORS);\n          return '<div class="materials-preview-colors">' +\n            swatches.map(c =>`);
  s = s.replace(`          return '<div class="materials-preview-colors" style="gap:10px">' +\n            swatches.map(c =>`, `          if (!swatches.length) swatches.push(...DEFAULT_PREVIEW_COLORS);\n          return '<div class="materials-preview-colors" style="gap:10px">' +\n            swatches.map(c =>`);
  s = s.replace(`        if (material.code?.html) {\n          try {\n            return '<div style="width:100%;min-height:200px;background:white;border-radius:8px;padding:16px;overflow:auto;">' + material.code?.html + '</div>';\n          } catch (e) {\n            return '<div class="materials-preview-code" style="max-height:200px">' + _escapeHtml(material.code?.html) + '</div>';\n          }\n        }\n        if (material.code?.css) {\n          return '<div style="width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;">背景预览</div>';\n        }\n        return '';`, `        return '<div class="materials-preview-code">代码预览按需加载</div>';`);
  s = s.replace(`    if (material.code?.html) {\n      html += '<div class="materials-code-section"><div class="materials-code-title">HTML 代码</div><div class="materials-code-block"><pre>' + _highlightCode(material.code?.html) + '</pre></div></div>';\n    }\n    if (material.code?.js) {\n      html += '<div class="materials-code-section"><div class="materials-code-title">JavaScript 代码</div><div class="materials-code-block"><pre>' + _highlightCode(material.code?.js) + '</pre></div></div>';\n    }`, `    /* preview code blocks are lazy loaded */`);

  fs.writeFileSync(p, s, 'utf8');
  console.log('patched', p);
}
