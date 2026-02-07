import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, AlertTriangle, Bold, Italic, Underline, Link2, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Undo2, Redo2 } from 'lucide-react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExtension from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import { Extension, Node, mergeAttributes } from '@tiptap/core'
import { Plugin } from 'prosemirror-state'

type EvidenceSource = {
  title: string
  url: string
  snippet: string
  publisher: string
  year: string
}

type GapItem = {
  sectionKey: string
  title: string
  detail: string
  severity: 'low' | 'medium' | 'high'
  sources: EvidenceSource[]
}

const SUGGESTION_MOCKS: Record<string, { title: string; text: string; sources: Array<{ label: string; href: string }> }> = {
  reason: {
    title: 'Sugestie',
    text: 'Pacientul se prezintă pentru durere gingivală recurentă, raportând disconfort la masticație și sensibilitate locală.',
    sources: [
      { label: 'ADA Guidelines – Gingival Pain', href: 'https://www.ada.org' },
      { label: 'NHS – Gum Pain', href: 'https://www.nhs.uk' },
    ],
  },
  'anamnesis.medicalHistory': {
    title: 'Sugestie',
    text: 'Istoric medical general relevant: fără afecțiuni sistemice raportate, fără tratamente cronice cunoscute.',
    sources: [
      { label: 'Cochrane – Medical History', href: 'https://www.cochranelibrary.com' },
      { label: 'MedlinePlus – Medical History', href: 'https://medlineplus.gov' },
    ],
  },
  'anamnesis.dentalHistory': {
    title: 'Sugestie',
    text: 'Istoric dentar: tratamente ortodontice anterioare; controale periodice neregulate.',
    sources: [
      { label: 'AAO – Orthodontic Care', href: 'https://aaoinfo.org' },
      { label: 'ADA – Dental History', href: 'https://www.ada.org' },
    ],
  },
  'observations.general': {
    title: 'Sugestie',
    text: 'Observații generale: gingie eritematoasă, sensibilitate locală la palpare, fără sângerare spontană.',
    sources: [
      { label: 'EFP – Periodontal Findings', href: 'https://www.efp.org' },
      { label: 'NICE – Oral Health', href: 'https://www.nice.org.uk' },
    ],
  },
  'observations.specialty': {
    title: 'Sugestie',
    text: 'Observații specifice: inflamație marginală ușoară în regiunea incisivilor, retracție gingivală localizată.',
    sources: [
      { label: 'EFP – Gingival Recession', href: 'https://www.efp.org' },
      { label: 'CDC – Oral Health', href: 'https://www.cdc.gov/oralhealth' },
    ],
  },
  'materials.investigations': {
    title: 'Sugestie',
    text: 'Investigații disponibile: fotografii intraorale; radiografie panoramică anterioară.',
    sources: [
      { label: 'ADA – Imaging', href: 'https://www.ada.org' },
      { label: 'RadiologyInfo', href: 'https://www.radiologyinfo.org' },
    ],
  },
  'materials.photos': {
    title: 'Sugestie',
    text: 'Fotografii clinice: imagini frontale și laterale ale arcadelor.',
    sources: [
      { label: 'AAO – Clinical Photos', href: 'https://aaoinfo.org' },
      { label: 'NHS – Oral Exams', href: 'https://www.nhs.uk' },
    ],
  },
  'materials.documents': {
    title: 'Sugestie',
    text: 'Alte documente: plan de tratament anterior, fișă de control ortodontic.',
    sources: [
      { label: 'ADA – Records', href: 'https://www.ada.org' },
      { label: 'NICE – Dental Records', href: 'https://www.nice.org.uk' },
    ],
  },
  clinicianNote: {
    title: 'Sugestie',
    text: 'Notă clinician: se recomandă monitorizarea sensibilității gingivale și reevaluare la 4–6 săptămâni.',
    sources: [
      { label: 'EFP – Follow-up', href: 'https://www.efp.org' },
      { label: 'NICE – Follow-up', href: 'https://www.nice.org.uk' },
    ],
  },
  actions: {
    title: 'Sugestie',
    text: 'Acțiuni: examinare clinică, discuții educaționale privind igiena orală, prezentare materiale informative.',
    sources: [
      { label: 'ADA – Patient Education', href: 'https://www.ada.org' },
      { label: 'WHO – Oral Health', href: 'https://www.who.int' },
    ],
  },
  'general.date': {
    title: 'Sugestie',
    text: new Date().toLocaleDateString('ro-RO'),
    sources: [{ label: 'ZenLink', href: '#' }],
  },
  'general.clinician': {
    title: 'Sugestie',
    text: 'Clinician',
    sources: [{ label: 'ZenLink', href: '#' }],
  },
  'general.specialty': {
    title: 'Sugestie',
    text: 'Stomatologie',
    sources: [{ label: 'ZenLink', href: '#' }],
  },
  'general.presentationType': {
    title: 'Sugestie',
    text: 'Control',
    sources: [{ label: 'ZenLink', href: '#' }],
  },
}

type ClinicianSheet = {
  general: {
    date: string
    clinician: string
    specialty: string
    presentationType: string
  }
  reason: string
  anamnesis: {
    medicalHistory: string
    treatments: string
    dentalHistory: string
    dentalTreatments: string
    contextNotes: string
  }
  observations: {
    general: string
    specialty: string
  }
  materials: {
    investigations: string
    photos: string
    documents: string
  }
  clinicianNote: string
  actions: string
  provenance: {
    patientReport: boolean
    clinicianObservations: boolean
    uploadedFiles: boolean
    citedMaterials: boolean
  }
  exportControl: {
    includeReason: boolean
    includeObservations: boolean
    includeActions: boolean
    includeAdministrative: boolean
    excludeInternalNote: boolean
    excludeSensitive: boolean
  }
}

const defaultSheet: ClinicianSheet = {
  general: {
    date: '',
    clinician: '',
    specialty: '',
    presentationType: '',
  },
  reason: '',
  anamnesis: {
    medicalHistory: '',
    treatments: '',
    dentalHistory: '',
    dentalTreatments: '',
    contextNotes: '',
  },
  observations: {
    general: '',
    specialty: '',
  },
  materials: {
    investigations: '',
    photos: '',
    documents: '',
  },
  clinicianNote: '',
  actions: '',
  provenance: {
    patientReport: true,
    clinicianObservations: true,
    uploadedFiles: false,
    citedMaterials: false,
  },
  exportControl: {
    includeReason: true,
    includeObservations: true,
    includeActions: true,
    includeAdministrative: true,
    excludeInternalNote: true,
    excludeSensitive: true,
  },
}

const SectionHeader = Node.create({
  name: 'sectionHeader',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: false,
  addAttributes() {
    return {
      title: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-section-header]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-section-header': 'true' }), HTMLAttributes.title]
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div')
      dom.className = 'mt-4 text-sm font-semibold text-gray-800'
      dom.contentEditable = 'false'
      dom.textContent = node.attrs.title
      return { dom }
    }
  },
})

const LockedParagraph = Node.create({
  name: 'lockedParagraph',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: false,
  addAttributes() {
    return {
      text: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'p[data-locked-paragraph]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { 'data-locked-paragraph': 'true' }), HTMLAttributes.text]
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('p')
      dom.className = 'text-xs text-gray-500 mt-2'
      dom.contentEditable = 'false'
      dom.textContent = node.attrs.text
      return { dom }
    }
  },
})

const FieldBlock = Node.create({
  name: 'fieldBlock',
  group: 'block',
  content: 'paragraph+',
  draggable: false,
  addAttributes() {
    return {
      sectionKey: { default: '' },
      label: { default: '' },
      suggestion: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-field-block]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-field-block': 'true' }), 0]
  },
  addProseMirrorPlugins() {
    const editor = this.editor as any
    return [
      new Plugin({
        props: {
          handleKeyDown(view: any, event: KeyboardEvent) {
            const { state } = view
            const { selection } = state
            const { $from } = selection
            for (let depth = $from.depth; depth > 0; depth -= 1) {
              const node = $from.node(depth)
              if (node.type.name === 'fieldBlock') {
                const sectionKey = node.attrs.sectionKey
                if (event.key === 'Tab' && node.attrs.suggestion) {
                  event.preventDefault()
                  editor.storage?.sectionSuggest?.onOpenSuggestion?.(sectionKey)
                  return true
                }
                if (event.key === 'Escape' && node.attrs.suggestion) {
                  event.preventDefault()
                  editor.storage?.sectionSuggest?.onClearSuggestion?.(sectionKey)
                  return true
                }
                if (event.key === 'Enter' && node.attrs.suggestion) {
                  event.preventDefault()
                  const insertPos = $from.after(depth) - 1
                  const prefix = node.textContent.trim().length > 0 ? ' ' : ''
                  const tr = state.tr.insertText(`${prefix}${node.attrs.suggestion}`, insertPos)
                  tr.setNodeMarkup($from.before(depth), undefined, { ...node.attrs, suggestion: '' })
                  view.dispatch(tr)
                  editor.storage?.sectionSuggest?.onClearSuggestion?.(sectionKey)
                  return true
                }
                break
              }
            }
            return false
          },
        },
      }),
    ]
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div')
      dom.className = 'mt-3'

      const labelRow = document.createElement('div')
      labelRow.className = 'flex items-center justify-between text-xs text-gray-500 mb-2'

      const label = document.createElement('div')
      label.className = 'text-xs text-gray-500'
      label.textContent = node.attrs.label

      const button = document.createElement('button')
      button.className = 'field-suggest-button text-xs px-3 py-1.5 rounded-full bg-purple-600 text-white border border-purple-500 shadow-sm hover:bg-purple-500'
      button.type = 'button'
      button.textContent = '🧠 Sugerează'
      button.setAttribute('data-suggest-button', node.attrs.sectionKey || '')
      button.onclick = () => {
        const sectionKey = node.attrs.sectionKey
        if (sectionKey) {
          const editorAny = this.editor as any
          editorAny.storage?.sectionSuggest?.onSuggest?.(sectionKey)
        }
      }

      labelRow.appendChild(label)
      labelRow.appendChild(button)

      const box = document.createElement('div')
      box.className = 'border border-gray-200 rounded-lg p-3 bg-white'

      const content = document.createElement('div')
      content.className = 'min-h-[56px] text-sm text-gray-800'

      const suggestion = document.createElement('div')
      suggestion.className = 'mt-2 text-sm text-gray-800'
      suggestion.textContent = node.attrs.suggestion || ''

      const popover = document.createElement('div')
      popover.className = 'suggestion-popover'
      popover.setAttribute('data-suggestion-popover', node.attrs.sectionKey || '')
      popover.style.display = 'none'

      const popoverArrow = document.createElement('div')
      popoverArrow.className = 'suggestion-arrow'

      const popoverTitle = document.createElement('div')
      popoverTitle.className = 'suggestion-title'

      const popoverText = document.createElement('div')
      popoverText.className = 'suggestion-text'

      const popoverSource = document.createElement('button')
      popoverSource.className = 'suggestion-source'
      popoverSource.type = 'button'
      popoverSource.textContent = 'Source'
      popoverSource.setAttribute('data-suggest-source', node.attrs.sectionKey || '')

      const popoverDropdown = document.createElement('div')
      popoverDropdown.className = 'suggestion-dropdown'
      popoverDropdown.setAttribute('data-suggest-source-dropdown', node.attrs.sectionKey || '')
      popoverDropdown.style.display = 'none'

      popoverSource.onclick = () => {
        popoverDropdown.style.display = popoverDropdown.style.display === 'none' ? 'block' : 'none'
      }

      popover.appendChild(popoverArrow)
      popover.appendChild(popoverTitle)
      popover.appendChild(popoverText)
      popover.appendChild(popoverSource)
      popover.appendChild(popoverDropdown)

      box.appendChild(content)
      if (node.attrs.suggestion) {
        box.appendChild(suggestion)
      }

      dom.appendChild(labelRow)
      dom.appendChild(box)
      dom.appendChild(popover)

      return {
        dom,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'fieldBlock') return false
          label.textContent = updatedNode.attrs.label
          button.style.display = 'inline-flex'
          const editorAny = (this.editor as any)
          const activeId = editorAny?.storage?.sectionSuggest?.activeId
          const mocks = editorAny?.storage?.sectionSuggest?.mocks || {}
          const mock = mocks[updatedNode.attrs.sectionKey]
          suggestion.textContent = updatedNode.attrs.suggestion || ''

          if (updatedNode.attrs.suggestion) {
            if (!box.contains(suggestion)) {
              box.appendChild(suggestion)
            }
          } else if (box.contains(suggestion)) {
            box.removeChild(suggestion)
          }

          if (activeId && updatedNode.attrs.sectionKey === activeId && mock) {
            popover.style.display = 'block'
            popover.classList.add('suggestion-popover-visible')
            popoverTitle.textContent = mock.title || 'Sugestie'
            popoverText.textContent = mock.text || ''
            popoverDropdown.innerHTML = ''
            if (mock.sources && mock.sources.length > 0) {
              mock.sources.forEach((source: any) => {
                const link = document.createElement('a')
                link.href = source.href
                link.target = '_blank'
                link.rel = 'noopener noreferrer'
                link.textContent = source.label
                popoverDropdown.appendChild(link)
              })
            }
          } else {
            popover.classList.remove('suggestion-popover-visible')
            popover.style.display = 'none'
            popoverDropdown.style.display = 'none'
          }
          return true
        },
        stopEvent: (event) => {
          return (event.target as HTMLElement).classList?.contains('field-suggest-button')
        },
      }
    }
  },
})


const buildTemplate = () => ({
  type: 'doc',
  content: [
    { type: 'sectionHeader', attrs: { title: '1. Date generale caz' } },
    { type: 'fieldBlock', attrs: { sectionKey: 'general.date', label: 'Data consultației', suggestion: '' }, content: [{ type: 'paragraph' }] },
    { type: 'fieldBlock', attrs: { sectionKey: 'general.clinician', label: 'Clinician', suggestion: '' }, content: [{ type: 'paragraph' }] },
    { type: 'fieldBlock', attrs: { sectionKey: 'general.specialty', label: 'Specialitate (ex. parodontologie)', suggestion: '' }, content: [{ type: 'paragraph' }] },
    { type: 'fieldBlock', attrs: { sectionKey: 'general.presentationType', label: 'Tip prezentare (prima prezentare / control / etc.)', suggestion: '' }, content: [{ type: 'paragraph' }] },

    { type: 'sectionHeader', attrs: { title: '2. Motivul prezentării (raportat de pacient)' } },
    { type: 'fieldBlock', attrs: { sectionKey: 'reason', label: '„Pacientul se prezintă pentru…”', suggestion: '' }, content: [{ type: 'paragraph' }] },
    { type: 'lockedParagraph', attrs: { text: '📌 Informație raportată de pacient, structurată pentru claritate.' } },

    { type: 'sectionHeader', attrs: { title: '3. Anamneză relevantă (structurată)' } },
    { type: 'fieldBlock', attrs: { sectionKey: 'anamnesis.medicalHistory', label: 'Istoric medical general (relevant)', suggestion: '' }, content: [{ type: 'paragraph' }] },
    { type: 'fieldBlock', attrs: { sectionKey: 'anamnesis.dentalHistory', label: 'Istoric dentar (afecțiuni heredocolaterale stomatologice)', suggestion: '' }, content: [{ type: 'paragraph' }] },

    { type: 'sectionHeader', attrs: { title: '4. Observații clinice (examen obiectiv)' } },
    { type: 'fieldBlock', attrs: { sectionKey: 'observations.general', label: 'Observații generale', suggestion: '' }, content: [{ type: 'paragraph' }] },
    { type: 'fieldBlock', attrs: { sectionKey: 'observations.specialty', label: 'Observații specifice specialității', suggestion: '' }, content: [{ type: 'paragraph' }] },
    { type: 'lockedParagraph', attrs: { text: '🔎 Observații factuale, fără formulări decizionale.' } },

    { type: 'sectionHeader', attrs: { title: '5. Date suplimentare & materiale' } },
    { type: 'fieldBlock', attrs: { sectionKey: 'materials.investigations', label: 'Investigații disponibile (imagini, radiografii)', suggestion: '' }, content: [{ type: 'paragraph' }] },
    { type: 'fieldBlock', attrs: { sectionKey: 'materials.photos', label: 'Fotografii clinice', suggestion: '' }, content: [{ type: 'paragraph' }] },
    { type: 'fieldBlock', attrs: { sectionKey: 'materials.documents', label: 'Alte documente încărcate', suggestion: '' }, content: [{ type: 'paragraph' }] },
    { type: 'lockedParagraph', attrs: { text: '📂 ZenLink păstrează trasabilitatea sursei fiecărui material.' } },

    { type: 'sectionHeader', attrs: { title: '6. Notă clinică – clinician (uman)' } },
    { type: 'fieldBlock', attrs: { sectionKey: 'clinicianNote', label: 'Notă clinician', suggestion: '' }, content: [{ type: 'paragraph' }] },

    { type: 'sectionHeader', attrs: { title: '7. Acțiuni realizate în cadrul consultației (educarea pacientului + tratamentul)' } },
    { type: 'fieldBlock', attrs: { sectionKey: 'actions', label: 'Examinare clinică / discuții / materiale educaționale', suggestion: '' }, content: [{ type: 'paragraph' }] },
  ],
})

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {}
          return { style: `font-size: ${attributes.fontSize}` }
        },
      },
    }
  },
})

const LockStructure = Extension.create({
  name: 'lockStructure',
  addProseMirrorPlugins() {
    const countNodes = (doc: any) => {
      const counts = { sectionHeader: 0, lockedParagraph: 0, fieldBlock: 0 }
      doc.descendants((node: any) => {
        if (node.type?.name === 'sectionHeader') counts.sectionHeader += 1
        if (node.type?.name === 'lockedParagraph') counts.lockedParagraph += 1
        if (node.type?.name === 'fieldBlock') counts.fieldBlock += 1
        return true
      })
      return counts
    }

    return [
      new Plugin({
        filterTransaction: (tr, state) => {
          if (!tr.docChanged) return true
          const before = countNodes(state.doc)
          const after = countNodes(tr.doc)
          if (after.sectionHeader < before.sectionHeader) return false
          if (after.lockedParagraph < before.lockedParagraph) return false
          if (after.fieldBlock < before.fieldBlock) return false
          return true
        },
      }),
    ]
  },
})

export default function ClinicianClaritySheet() {
  const { appointmentId = '' } = useParams()
  const navigate = useNavigate()

  const [sheet, setSheet] = useState<ClinicianSheet>(defaultSheet)
  const [searchMode, setSearchMode] = useState<'quick' | 'deep'>('quick')
  const [activeSource, setActiveSource] = useState<EvidenceSource | null>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'gaps'>('editor')
  const [gapItems, setGapItems] = useState<GapItem[]>([])
  const [isLoadingGaps, setIsLoadingGaps] = useState(false)
  const [activeSuggestionKey, setActiveSuggestionKey] = useState<string | null>(null)
  const [patientName, setPatientName] = useState<string>('')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [spaceDown, setSpaceDown] = useState(false)
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const storageKey = useMemo(() => `consultation:clinician-sheet:${appointmentId}`, [appointmentId])
  const transcriptKey = useMemo(() => `consultation:transcript:${appointmentId}`, [appointmentId])
  const contextKey = useMemo(() => `consultation:context:${appointmentId}`, [appointmentId])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      UnderlineExtension,
      Link.configure({ openOnClick: false }),
      FontSize,
      TextAlign.configure({ types: ['paragraph'] }),
      SectionHeader,
      LockedParagraph,
      FieldBlock,
      LockStructure,
    ],
    content: buildTemplate(),
    editorProps: {
      attributes: {
        class: 'outline-none text-gray-800',
      },
    },
  })

  const lastTranscriptRef = useRef<string>('')

  useEffect(() => {
    if (!appointmentId) return
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        setSheet(JSON.parse(saved))
      } catch {
        setSheet(defaultSheet)
      }
    }
    const savedTranscript = localStorage.getItem(transcriptKey)
    if (savedTranscript) {
      lastTranscriptRef.current = savedTranscript
    }
    const savedContext = localStorage.getItem(contextKey)
    if (savedContext) {
      try {
        const parsed = JSON.parse(savedContext)
        if (parsed?.patient?.displayName) {
          setPatientName(parsed.patient.displayName)
        }
      } catch {
        // ignore
      }
    }
  }, [appointmentId, storageKey, transcriptKey, contextKey])

  useEffect(() => {
    // Auto-fill known header fields if empty
    setSheet(prev => {
      const next = { ...prev, general: { ...prev.general } }
      if (!next.general.date) {
        next.general.date = new Date().toLocaleDateString('ro-RO')
      }
      if (!next.general.clinician) {
        try {
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            const user = JSON.parse(storedUser)
            const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
            if (name) {
              next.general.clinician = name
            }
          }
        } catch {
          // ignore
        }
      }
      return next
    })
  }, [])

  const setFieldContent = useCallback((sectionKey: string, text: string) => {
    if (!editor) return
    const { state } = editor
    let targetPos: number | null = null
    let targetNode: any = null
    state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'fieldBlock' && node.attrs.sectionKey === sectionKey) {
        targetPos = pos
        targetNode = node
        return false
      }
      return true
    })
    if (targetPos === null || !targetNode) return
    const from = targetPos + 1
    const to = targetPos + Number(targetNode.nodeSize) - 1
    const paragraph = state.schema.node('paragraph', null, text ? state.schema.text(text) : undefined)
    const tr = state.tr.replaceWith(from, to, paragraph)
    editor.view.dispatch(tr)
  }, [editor])

  const setFieldSuggestion = useCallback((sectionKey: string, suggestion: string) => {
    if (!editor) return
    const { state } = editor
    let targetPos: number | null = null
    let targetNode: any = null
    state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'fieldBlock' && node.attrs.sectionKey === sectionKey) {
        targetPos = pos
        targetNode = node
        return false
      }
      return true
    })
    if (targetPos === null || !targetNode) return
    const tr = state.tr.setNodeMarkup(targetPos, undefined, {
      ...targetNode.attrs,
      suggestion,
    })
    editor.view.dispatch(tr)
  }, [editor])

  const clearFieldSuggestion = useCallback((sectionKey: string) => {
    setFieldSuggestion(sectionKey, '')
  }, [setFieldSuggestion])

  useEffect(() => {
    if (!editor) return
    if (sheet.general.date) {
      setFieldContent('general.date', sheet.general.date)
    }
    if (sheet.general.clinician) {
      setFieldContent('general.clinician', sheet.general.clinician)
    }
  }, [editor, sheet.general.date, sheet.general.clinician, setFieldContent])

  useEffect(() => {
    if (!activeSuggestionKey) return
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target) return
      const isInsidePopover = target.closest(`[data-suggestion-popover="${activeSuggestionKey}"]`)
      const isButton = target.closest(`[data-suggest-button="${activeSuggestionKey}"]`)
      const isSource = target.closest(`[data-suggest-source="${activeSuggestionKey}"]`)
      const isDropdown = target.closest(`[data-suggest-source-dropdown="${activeSuggestionKey}"]`)
      if (isInsidePopover || isButton || isSource || isDropdown) return
      setActiveSuggestionKey(null)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveSuggestionKey(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [activeSuggestionKey])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Link URL', previousUrl || '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const setFontSize = useCallback((size: string) => {
    if (!editor) return
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
  }, [editor])


  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    const delta = -event.deltaY
    setZoom((prev) => {
      const next = Math.min(1.5, Math.max(0.6, prev + delta * 0.001))
      return Number(next.toFixed(2))
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpaceDown(true)
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpaceDown(false)
        setIsPanning(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const handlePanStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if (!spaceDown && event.target !== event.currentTarget) return
    setIsPanning(true)
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      ox: offset.x,
      oy: offset.y,
    }
  }, [spaceDown, offset])

  const handlePanMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !panStartRef.current) return
    const dx = event.clientX - panStartRef.current.x
    const dy = event.clientY - panStartRef.current.y
    setOffset({
      x: panStartRef.current.ox + dx,
      y: panStartRef.current.oy + dy,
    })
  }, [isPanning])

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
    panStartRef.current = null
  }, [])

  const handleFinalize = useCallback(() => {
    if (!appointmentId) return
    localStorage.setItem(`consultation:clinician-sheet:finalized:${appointmentId}`, new Date().toISOString())
  }, [appointmentId])

  useEffect(() => {
    if (!appointmentId) return
    localStorage.setItem(storageKey, JSON.stringify(sheet))
  }, [appointmentId, sheet, storageKey])

  useEffect(() => {
    if (!appointmentId) return
    const interval = setInterval(() => {
      const savedTranscript = localStorage.getItem(transcriptKey) || ''
      if (savedTranscript && savedTranscript !== lastTranscriptRef.current) {
        lastTranscriptRef.current = savedTranscript
      }
    }, 1500)
    return () => clearInterval(interval)
  }, [appointmentId, transcriptKey])

  const updateSheet = useCallback((path: string, value: string | boolean) => {
    setSheet(prev => {
      const updated = { ...prev } as any
      const keys = path.split('.')
      let cursor = updated
      keys.slice(0, -1).forEach(k => {
        cursor[k] = { ...cursor[k] }
        cursor = cursor[k]
      })
      cursor[keys[keys.length - 1]] = value
      return updated
    })
  }, [])

  const suggestField = useCallback((fieldKey: string) => {
    const mock = SUGGESTION_MOCKS[fieldKey]
    if (!mock) return
    setFieldSuggestion(fieldKey, mock.text)
  }, [setFieldSuggestion])

  const handleSuggestForSection = useCallback((sectionKey: string) => {
    const editorAny = editor as any
    const currentActive = editorAny?.storage?.sectionSuggest?.activeId
    const nextActive = currentActive === sectionKey ? null : sectionKey
    setActiveSuggestionKey(nextActive)
    suggestField(sectionKey)
  }, [suggestField, editor])

  useEffect(() => {
    if (!editor) return
    const editorAny = editor as any
    editorAny.storage.sectionSuggest = {
      onSuggest: handleSuggestForSection,
      onOpenSuggestion: (key: string) => setActiveSuggestionKey(key),
      onClearSuggestion: (key: string) => {
        clearFieldSuggestion(key)
      },
      setActive: (key: string | null) => setActiveSuggestionKey(key),
      activeId: activeSuggestionKey,
      mocks: SUGGESTION_MOCKS,
    }
    editor.view.dispatch(editor.state.tr.setMeta('suggestion-ui', { activeSuggestionKey }))
  }, [editor, handleSuggestForSection, clearFieldSuggestion, activeSuggestionKey])


  const loadGaps = useCallback(async () => {
    if (isLoadingGaps) return
    setIsLoadingGaps(true)
    try {
      setGapItems([
        {
          sectionKey: 'reason',
          title: 'Lipsește durata simptomelor',
          detail: 'Nu este menționată durata exactă a durerii gingivale.',
          severity: 'medium',
          sources: [
            { title: 'ADA Guidelines', url: 'https://www.ada.org', snippet: 'Documentați durata simptomelor.', publisher: 'ADA', year: '2024' },
          ],
        },
      ])
    } finally {
      setIsLoadingGaps(false)
    }
  }, [isLoadingGaps])

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <div className="w-full px-4 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            Înapoi la consultație
          </button>
          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1 text-xs">
            <button
              onClick={() => setSearchMode('quick')}
              className={`px-2 py-1 rounded-md transition-colors ${
                searchMode === 'quick' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              Quick
            </button>
            <button
              onClick={() => setSearchMode('deep')}
              className={`px-2 py-1 rounded-md transition-colors ${
                searchMode === 'deep' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              Deep
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c0c18] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'editor'
                    ? 'bg-purple-500/20 text-purple-100 border border-purple-500/40'
                    : 'bg-white/5 text-white/50'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => {
                  setActiveTab('gaps')
                  loadGaps()
                }}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'gaps'
                    ? 'bg-purple-500/20 text-purple-100 border border-purple-500/40'
                    : 'bg-white/5 text-white/50'
                }`}
              >
                Gaps & Proof
              </button>
            </div>
            {activeTab === 'gaps' && (
              <button
                onClick={loadGaps}
                className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white"
              >
                Re-analizează
              </button>
            )}
          </div>

          {activeTab === 'editor' && (
            <div className="px-2 py-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
                    className="px-2 py-1 rounded border border-white/10 bg-white/5 text-white/70"
                  >
                    -
                  </button>
                  <div className="text-xs text-white/60 w-12 text-center">{Math.round(zoom * 100)}%</div>
                  <button
                    onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
                    className="px-2 py-1 rounded border border-white/10 bg-white/5 text-white/70"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFinalize}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white"
                  >
                    Finalizează
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30"
                  >
                    Printează
                  </button>
                </div>
              </div>

              <div
                className="rounded-2xl border border-white/10 bg-white/5 p-4 overflow-hidden"
                onWheel={handleWheel}
                onMouseDown={handlePanStart}
                onMouseMove={handlePanMove}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
              >
                <div
                  className="mx-auto"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                    transition: isPanning ? 'none' : 'transform 0.05s linear',
                  }}
                >
                  <div className="bg-white text-[#1f1f2a] rounded-xl shadow-xl mx-auto max-w-[794px]">
                    <div className="px-10 py-6">
                  <h1 className="text-xl font-semibold text-purple-700">ZenLink</h1>
                  <p className="text-xs text-gray-500 mt-1">Clinician Clarity Sheet</p>
                  <div className="h-[2px] bg-purple-500/70 mt-3" />
                  <p className="text-[11px] text-gray-500 mt-2">
                    ZenLink NU oferă decizii medicale. Clinicianul rămâne integral responsabil.
                  </p>
                  {patientName && (
                    <p className="text-[11px] text-gray-500 mt-2">Pacient: {patientName}</p>
                  )}
                </div>

                    <div
                      className="px-8 pb-8"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, transparent 0, transparent 1122px, #e5e7eb 1122px, #e5e7eb 1123px)',
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2 border border-gray-200 rounded-lg p-2 bg-white sticky top-0 z-10">
                    <button onClick={() => editor?.chain().focus().toggleBold().run()} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button onClick={() => editor?.chain().focus().toggleItalic().run()} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <Underline className="w-4 h-4" />
                    </button>
                    <button onClick={setLink} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <Link2 className="w-4 h-4" />
                    </button>
                    <div className="h-5 w-px bg-gray-200" />
                    <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <div className="h-5 w-px bg-gray-200" />
                    <button onClick={() => editor?.chain().focus().setTextAlign('left').run()} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => editor?.chain().focus().setTextAlign('center').run()} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button onClick={() => editor?.chain().focus().setTextAlign('right').run()} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <div className="h-5 w-px bg-gray-200" />
                    <select
                      onChange={(e) => setFontSize(e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1"
                      defaultValue="14px"
                    >
                      <option value="12px">12</option>
                      <option value="14px">14</option>
                      <option value="16px">16</option>
                      <option value="18px">18</option>
                    </select>
                    <div className="h-5 w-px bg-gray-200" />
                    <button onClick={() => editor?.chain().focus().undo().run()} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => editor?.chain().focus().redo().run()} className="toolbar-btn p-2 rounded hover:bg-gray-100">
                      <Redo2 className="w-4 h-4" />
                    </button>
                  </div>

                      <div className="mt-4">
                        <EditorContent editor={editor} />
                      </div>

                      <div className="mt-6">
                        <div className="text-sm font-semibold text-gray-800">8. Claritate & proveniența informației</div>
                        <CheckboxGrid
                          items={[
                            { key: 'patientReport', label: 'raport pacient' },
                            { key: 'clinicianObservations', label: 'observații clinician' },
                            { key: 'uploadedFiles', label: 'fișiere încărcate' },
                            { key: 'citedMaterials', label: 'materiale educaționale citate' },
                          ]}
                          values={sheet.provenance}
                          onChange={(key, value) => updateSheet(`provenance.${key}`, value)}
                        />
                        <p className="text-xs text-gray-500">🧭 No source, no say — principiu ZenLink.</p>
                      </div>

                      <div className="mt-6">
                        <div className="text-sm font-semibold text-gray-800">9. Control export către pacient</div>
                        <CheckboxGrid
                          items={[
                            { key: 'includeReason', label: 'motivul prezentării' },
                            { key: 'includeObservations', label: 'rezumat observații' },
                            { key: 'includeActions', label: 'acțiuni realizate' },
                            { key: 'includeAdministrative', label: 'pași administrativi următori' },
                            { key: 'excludeInternalNote', label: 'exclude notă clinică internă' },
                            { key: 'excludeSensitive', label: 'exclude observații sensibile' },
                          ]}
                          values={sheet.exportControl}
                          onChange={(key, value) => updateSheet(`exportControl.${key}`, value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gaps' && (
            <div className="px-6 py-6 space-y-4">
              {isLoadingGaps && (
                <div className="text-sm text-white/50">Se analizează gap-urile…</div>
              )}
              {!isLoadingGaps && gapItems.length === 0 && (
                <div className="text-sm text-white/50">Nu au fost găsite gap-uri cu surse.</div>
              )}
              {gapItems.map((gap, idx) => (
                <div key={`gap-${idx}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-300" />
                      <p className="text-sm text-white/80 font-medium">{gap.title}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      gap.severity === 'high'
                        ? 'bg-red-500/20 text-red-300'
                        : gap.severity === 'medium'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {gap.severity}
                    </span>
                  </div>
                  {gap.detail && <p className="text-sm text-white/60 mt-2">{gap.detail}</p>}
                  {gap.sources && gap.sources.length > 0 && (
                    <div className="mt-3">
                      <SourceRow sources={gap.sources} onSelect={setActiveSource} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeSource && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
          <div className="w-full max-w-lg rounded-2xl bg-[#0c0c18] border border-white/10 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-white font-semibold">{activeSource.title || 'Sursă'}</p>
                <p className="text-xs text-white/50">{activeSource.publisher || 'Publisher'} • {activeSource.year || '—'}</p>
              </div>
              <button
                onClick={() => setActiveSource(null)}
                className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            {activeSource.snippet && (
              <p className="mt-3 text-sm text-white/70 leading-relaxed">{activeSource.snippet}</p>
            )}
            {activeSource.url && (
              <a
                href={activeSource.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm text-purple-300 hover:text-purple-200"
              >
                Deschide documentația →
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  )
}


const CheckboxGrid = ({
  items,
  values,
  onChange,
}: {
  items: Array<{ key: string; label: string }>
  values: Record<string, boolean>
  onChange: (key: string, value: boolean) => void
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
    {items.map((item) => (
      <label key={item.key} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={values[item.key]}
          onChange={(e) => onChange(item.key, e.target.checked)}
        />
        {item.label}
      </label>
    ))}
  </div>
)

const SourceRow = ({
  sources,
  onSelect,
}: {
  sources: EvidenceSource[]
  onSelect: (source: EvidenceSource) => void
}) => (
  <div className="flex flex-wrap gap-2">
    {sources.map((source, idx) => (
      <button
        key={`${source.title || 'source'}-${idx}`}
        onClick={() => onSelect(source)}
        className="text-xs px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
      >
        {source.title || 'Sursă'}
      </button>
    ))}
  </div>
)


