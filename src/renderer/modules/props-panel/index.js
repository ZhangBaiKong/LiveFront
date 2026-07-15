/* LiveFront Properties Panel 模块 */
(function () {
  LiveFront.modules.register({
    id: 'props-panel',
    name: '属性面板',
    version: '0.1.0',
    description: '选中元素的 CSS 属性可视化编辑',

    dependencies: [],
    optionalDependencies: ['preview', 'editor'],

    ui: {},

    commands: [],
    shortcuts: [],
    menus: [],
    contextMenus: [],

    events: {
      emits: [
        { name: 'modification:created', payload: '{ label, selector, property, value }' }
      ],
      listens: ['element:selected', 'element:deselected']
    },

    state: {},

    async init(ctx) {
      this._ctx = ctx
      this._selectedElement = null

      // 替换默认的属性 Tab 为我们的实现
      ctx.eventBus.on('element:selected', (data) => {
        console.log('[PropsPanel] element:selected received:', data.tagName, data.selector);
        this._selectedElement = data
        this._updatePanel()
      })

      ctx.eventBus.on('element:deselected', () => {
        this._selectedElement = null
      // 替换默认的属性 Tab 为我们的实现
      })

      // 注册 Phase 0 事件 Tab 内容
      if (LiveFront.PanelManager) {
        LiveFront.PanelManager.registerTab({
          id: 'props',
          label: '属性',
          icon: '',
          render: (container) => this._renderPanel(container)
        })
      }

      console.log('[PropsPanel] Module initialized')
    },

    _renderPanel(container) {
      this._panelContainer = container
      this._updatePanel()
    },

    _updatePanel() {
      console.log('[PropsPanel] _updatePanel called, selectedElement:', this._selectedElement?.tagName || 'null');
      if (!this._panelContainer) return
      this._panelContainer.innerHTML = ''

      if (!this._selectedElement) {
        this._panelContainer.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);gap:8px;padding:20px;text-align:center;">
            <div style="font-size:24px;opacity:0.5;"></div>
            <div style="font-size:12px;">请在预览区点击元素<br>以查看和编辑属性</div>
        `
        return
      }

      const el = this._selectedElement
      const cs = el.computedStyles || {}

      // 元素信息卡
      const infoCard = document.createElement('div')

      infoCard.innerHTML = `
        <div style="font-size:18px;font-weight:700;color:var(--accent);margin-bottom:4px;">${el.tagName}</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);margin-bottom:8px;">${el.selector}</div>
        <div style="font-size:11px;color:var(--text-secondary);display:flex;gap:16px;">
          <span>尺寸: ${el.rect.width} × ${el.rect.height}</span>
          <span>位置: ${el.rect.x}, ${el.rect.y}</span>
      `
      this._panelContainer.appendChild(infoCard)

      // 排版
      const props = document.createElement('div')


      // 排版
      this._addSection(props, '排版', [
        { label: 'font-size', value: cs.fontSize, type: 'text' },
        { label: 'font-weight', value: cs.fontWeight, type: 'text' },
        { label: 'color', value: cs.color, type: 'color' },
        { label: 'text-align', value: cs.textAlign, type: 'text' },
        { label: 'line-height', value: cs.lineHeight, type: 'text' },
      ])

      // 尺寸
      this._addSection(props, '尺寸', [
        { label: 'width', value: cs.width, type: 'text' },
        { label: 'height', value: cs.height, type: 'text' },
      ])

      // 尺寸
      this._addSection(props, '尺寸', [
        { label: 'padding', value: cs.padding, type: 'text' },
        { label: 'margin', value: cs.margin, type: 'text' },
      ])

      // 边框
      this._addSection(props, '边框', [
        { label: 'border', value: cs.border, type: 'text' },
        { label: 'border-radius', value: cs.borderRadius, type: 'text' },
      ])

      // 背景
      this._addSection(props, '背景', [
        { label: 'background-color', value: cs.backgroundColor, type: 'color' },
      ])

      // 效果
      this._addSection(props, '效果', [
        { label: 'opacity', value: cs.opacity, type: 'text' },
        { label: 'box-shadow', value: cs.boxShadow, type: 'text' },
      ])

      // 布局
      this._addSection(props, '布局', [
        { label: 'display', value: cs.display, type: 'text' },
        { label: 'position', value: cs.position, type: 'text' },
        { label: 'overflow', value: cs.overflow, type: 'text' },
      ])

      this._panelContainer.appendChild(props)
    },

    _addSection(container, title, properties) {
      const section = document.createElement('div')
      section.style.cssText = 'margin-bottom:12px;'

      const header = document.createElement('div')
      header.style.cssText = 'font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--border);'
      header.textContent = title
      section.appendChild(header)

      for (const prop of properties) {
        const row = document.createElement('div')
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;min-height:28px;'

        const label = document.createElement('label')
        label.style.cssText = 'font-size:11px;color:var(--text-secondary);width:100px;flex-shrink:0;font-family:var(--font-mono);'
        label.textContent = prop.label
        row.appendChild(label)

        if (prop.type === 'color' && this._isColorValue(prop.value)) {
          // 颜色选择器
          const colorBtn = document.createElement('button')
          colorBtn.style.cssText = 'width:24px;height:24px;border-radius:4px;border:1px solid var(--border);cursor:pointer;flex-shrink:0;background:' + (prop.value || 'transparent') + ';'
          colorBtn.title = prop.value

          const colorInput = document.createElement('input')
          colorInput.type = 'color'
          colorInput.value = this._toHexColor(prop.value)
          colorInput.style.cssText = 'position:absolute;opacity:0;width:0;height:0;'

          colorInput.addEventListener('input', (e) => {
            colorBtn.style.background = e.target.value
            this._applyProperty(prop.label, e.target.value)
          })

          const colorWrap = document.createElement('div')
          colorWrap.style.cssText = 'position:relative;display:inline-flex;'
          colorWrap.appendChild(colorBtn)
          colorWrap.appendChild(colorInput)
          colorBtn.addEventListener('click', () => colorInput.click())
          row.appendChild(colorWrap)

          // hex 输入
          const hexInput = document.createElement('input')
          hexInput.value = prop.value || ''
          hexInput.style.cssText = 'flex:1;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:3px;padding:3px 6px;font-size:11px;font-family:var(--font-mono);color:var(--text-primary);min-width:0;'
          hexInput.addEventListener('change', (e) => {
            colorBtn.style.background = e.target.value
            this._applyProperty(prop.label, e.target.value)
          })
          row.appendChild(hexInput)
        } else {
          const input = document.createElement('input')
          input.value = prop.value || ''
          input.style.cssText = 'flex:1;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:3px;padding:3px 6px;font-size:11px;font-family:var(--font-mono);color:var(--text-primary);min-width:0;'
          input.addEventListener('change', (e) => {
            this._applyProperty(prop.label, e.target.value)
          })
          row.appendChild(input)
        }

        section.appendChild(row)
      }

      container.appendChild(section)
    },

    _isColorValue(val) {
      if (!val) return false
      return /^(rgb|rgba|hsl|hsla|#[0-9a-f])/i.test(val) || val === 'transparent'
    },

    _toHexColor(val) {
      if (!val) return '#000000'
      if (val.startsWith('#') && val.length === 7) return val
      if (val.startsWith('#') && val.length === 4) {
        return '#' + val[1]+val[1] + val[2]+val[2] + val[3]+val[3]
      }
      // rgb to hex
      const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (m) {
        return '#' + [m[1],m[2],m[3]].map(x => parseInt(x).toString(16).padStart(2,'0')).join('')
      }
      return '#000000'
    },

    _applyProperty(property, value) {
      if (!this._selectedElement) return

      const selector = this._selectedElement.selector
      const label = `设置 ${selector} 的 ${property} 为 ${value}`

      // 写入第一个打开的 CSS 文件;若无则写入第一个 HTML 文件的 head 中
      const openFiles = LiveFront.Editor?.getOpenFiles() || []
      const cssEntry = openFiles.find(f => f.language === 'css' || f.name?.endsWith('.css'))

      try {
        if (cssEntry) {
          let css = cssEntry.model.getValue()
          const safeSel = selector.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
          const ruleRegex = new RegExp(safeSel + '\\s*\\{([^}]*)\\}')
          const match = css.match(ruleRegex)
          if (match) {
            css = css.replace(ruleRegex, selector + ' {\n' + match[1].trimEnd() + '\n  ' + property + ': ' + value + ';\n}')
          } else {
            css = css.trimEnd() + '\n' + selector + ' {\n  ' + property + ': ' + value + ';\n}\n'
          }
          cssEntry.model.setValue(css)
          LiveFront.Editor?.saveFile(cssEntry.path)
        } else {
          const htmlEntry = openFiles.find(f => f.language === 'html' || f.name?.endsWith('.html'))
          if (htmlEntry) {
            let html = htmlEntry.model.getValue()
            const inject = '<style>' + selector + ' { ' + property + ': ' + value + '; }</style>'
            if (html.includes('</head>')) {
              html = html.replace('</head>', inject + '\n</head>')
            } else {
              html = inject + '\n' + html
            }
            htmlEntry.model.setValue(html)
            LiveFront.Editor?.saveFile(htmlEntry.path)
          }
        }
      } catch (e) {
        console.warn('[PropsPanel] _applyProperty failed', e)
      }

      LiveFront.EventBus.emit('modification:created', {
        label,
        selector,
        property,
        value,
        source: 'user'
      })

      // 通过注入脚本直接更新预览样式
      const wv = LiveFront.Preview?.getWebview()
      if (wv) {
        const code = `
          (function() {
            var el = document.querySelector('${selector.replace(/'/g, "\\'")}');
            if (el) el.style['${property.replace(/'/g, "\\'")}'] = '${value.replace(/'/g, "\\'")}';
          })();
        `
        wv.executeJavaScript(code).catch(() => {})
      }
    }
  })
})()
