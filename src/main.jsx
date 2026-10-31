import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, ChevronDown, Copy, HeartPulse, Map, Menu, MessageCircle, Mic2, RotateCcw, Search, ShoppingBag, Utensils, Volume2, X } from 'lucide-react'
import { createEspeak, toFloat32 } from '@spelling-creator/spellophone/browser'
import { categories, conversations, phrases } from './data/phrases'
import './Main.css'

const iconMap = { health: HeartPulse, transport: Map, shopping: ShoppingBag, education: BookOpen, food: Utensils }
let kannadaEnginePromise
let currentAudioSource

function Icon({ name, size = 20 }) {
  const Component = iconMap[name] || BookOpen
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" />
}

function PhraseCard({ phrase }) {
  const [copied, setCopied] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')
  const [audioMessage, setAudioMessage] = useState('')
  async function copyPhrase() {
    try {
      await navigator.clipboard.writeText(phrase.kannada)
      setCopied(true)
      setCopyMessage('Kannada phrase copied.')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
      setCopyMessage('Could not copy here. Select the Kannada text and copy it manually.')
    }
  }
  async function speakPhrase() {
    if (!('speechSynthesis' in window)) {
      setAudioMessage('Using the built-in Kannada voice…')
    } else {
      const synth = window.speechSynthesis
      const kannadaVoice = synth.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('kn'))
      if (kannadaVoice) {
        const utterance = new SpeechSynthesisUtterance(phrase.kannada)
        utterance.lang = 'kn-IN'
        utterance.voice = kannadaVoice
        utterance.onstart = () => setAudioMessage(`Speaking with ${kannadaVoice.name}.`)
        utterance.onerror = (event) => setAudioMessage(`Audio could not start (${event.error}). Check your device volume and speech settings.`)
        synth.cancel()
        synth.speak(utterance)
        return
      }
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      setAudioMessage('Audio playback is not supported by this browser.')
      return
    }
    const audioContext = new AudioContextClass()
    try {
      await audioContext.resume()
      setAudioMessage('Loading the built-in Kannada voice…')
      kannadaEnginePromise ??= createEspeak({ cdn: 'jsdelivr' })
      const engine = await kannadaEnginePromise
      await engine.loadVoice('kn+f2')
      engine.setVoice('kn+f2')
      const result = engine.synthesize(phrase.kannada, { rate: 145 })
      const audioBuffer = audioContext.createBuffer(1, result.samples.length, result.sampleRate)
      audioBuffer.copyToChannel(toFloat32(result.samples), 0)
      currentAudioSource?.stop()
      const source = audioContext.createBufferSource()
      currentAudioSource = source
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      source.onended = () => {
        if (currentAudioSource === source) currentAudioSource = undefined
        audioContext.close()
        setAudioMessage('Finished speaking with the built-in female-style Kannada voice.')
      }
      source.start()
      setAudioMessage('Speaking Kannada with the built-in female-style voice.')
    } catch (error) {
      kannadaEnginePromise = undefined
      await audioContext.close()
      console.error('Kannada speech synthesis failed:', error)
      setAudioMessage('Could not load the Kannada voice. Check your internet connection and try again.')
    }
  }
  return <article className="phrase-card">
    <div className="phrase-main"><span className="phrase-label">KANNADA</span><p className="kannada" lang="kn">{phrase.kannada}</p><p className="meaning">{phrase.meaning}</p></div>
    <div className="phrase-detail"><span className="phrase-label">SAY IT LIKE</span><p className="pronunciation">{phrase.pronunciation}</p><p className="context">{phrase.context}</p></div>
    <div className="phrase-actions"><button className="icon-button" aria-label={copied ? 'Copied Kannada phrase' : 'Copy Kannada phrase'} title="Copy Kannada" onClick={copyPhrase}>{copied ? <Check size={17} /> : <Copy size={17} />}</button><button className="icon-button" aria-label="Speak Kannada phrase" title="Speak phrase" onClick={speakPhrase}><Volume2 size={18} /></button></div>
    {copyMessage && <p className="phrase-feedback" role="status">{copyMessage}</p>}
    {audioMessage && <p className="phrase-feedback" role="status">{audioMessage}</p>}
  </article>
}

function createQuizQuestions(categoryId) {
  const pool = categoryId === 'all' ? phrases : phrases.filter((phrase) => phrase.category === categoryId)
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(10, pool.length)).map((phrase) => {
    const distractors = phrases.filter((option) => option.id !== phrase.id).sort(() => Math.random() - 0.5).slice(0, 3)
    return { phrase, options: [phrase, ...distractors].sort(() => Math.random() - 0.5) }
  })
}

export default function Main() {
  const [view, setView] = useState('home')
  const [activeCategory, setActiveCategory] = useState(null)
  const [query, setQuery] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [quizCategory, setQuizCategory] = useState('all')
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState(null)
  const [quizScore, setQuizScore] = useState(0)
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const searchResults = useMemo(() => normalizedQuery ? phrases.filter((phrase) => [phrase.kannada, phrase.meaning, phrase.pronunciation, phrase.context, ...phrase.keywords].join(' ').toLocaleLowerCase().includes(normalizedQuery)) : [], [normalizedQuery])
  const visiblePhrases = activeCategory ? phrases.filter((phrase) => phrase.category === activeCategory.id) : []
  const title = view === 'category' ? activeCategory?.name : view === 'conversations' ? 'Everyday conversations' : 'Find your words'

  function openCategory(category) { setActiveCategory(category); setView('category'); setQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function goHome() { setView('home'); setActiveCategory(null); setQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function startQuiz() { setQuizQuestions(createQuizQuestions(quizCategory)); setQuizIndex(0); setQuizAnswer(null); setQuizScore(0) }
  function answerQuiz(option) { if (quizAnswer) return; setQuizAnswer(option.id); if (option.id === quizQuestions[quizIndex].phrase.id) setQuizScore((score) => score + 1) }
  function nextQuizQuestion() { setQuizAnswer(null); setQuizIndex((index) => index + 1) }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#home" onClick={(event) => { event.preventDefault(); goHome() }}><span className="brand-mark">ಕ</span><span>Kannada<span className="brand-accent">Mitra</span><small>Kannada for Real Life</small></span></a>
      <button className="mobile-menu-button" aria-label={mobileMenu ? 'Close menu' : 'Open menu'} onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X /> : <Menu />}</button>
      <nav className={mobileMenu ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation"><button className={view === 'home' || view === 'category' ? 'nav-link active' : 'nav-link'} onClick={() => { goHome(); setMobileMenu(false) }}>Explore phrases</button><button className={view === 'conversations' ? 'nav-link active' : 'nav-link'} onClick={() => { setView('conversations'); setMobileMenu(false); setQuery('') }}>Conversations</button><button className={view === 'quiz' ? 'nav-link active' : 'nav-link'} onClick={() => { setView('quiz'); setMobileMenu(false); setQuery(''); setQuizQuestions([]) }}>Quizzes</button><a className="nav-cta" href="#categories" onClick={(e) => { e.preventDefault(); goHome(); document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }) }}>Start learning <ArrowRight size={16} /></a></nav>
    </header>
    <main>
      {view === 'home' && <>
        <section className="hero-section"><div className="hero-copy"><span className="eyebrow"><span className="sparkle">✳</span> A little Kannada goes a long way</span><h1>Make every day<br />feel a little <em>closer.</em></h1><p className="hero-description">Useful Kannada for the moments that make up real life. Start with a phrase, and take it from there.</p>
          <div className="search-wrap"><Search size={20} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you want to say in Kannada?" aria-label="Search Kannada phrases" /><kbd>↵</kbd></div><div className="quick-search">Try <button onClick={() => setQuery('where')}>“Where is…”</button><button onClick={() => setQuery('price')}>“How much?”</button><button onClick={() => setQuery('help')}>“I need help”</button></div></div>
          <div className="hero-art" aria-label="Illustration of a friendly conversation"><div className="sun-disc"></div><div className="art-leaf leaf-one">✳</div><div className="art-leaf leaf-two">✳</div><div className="speech-bubble bubble-kannada" lang="kn">ನಮಸ್ಕಾರ!</div><div className="speech-bubble bubble-english">Hello there <span>☺</span></div><div className="person person-left"><div className="hair"></div><div className="face"><span className="eye"></span><span className="eye"></span><span className="smile"></span></div><div className="body"></div></div><div className="person person-right"><div className="hair"></div><div className="face"><span className="eye"></span><span className="eye"></span><span className="smile"></span></div><div className="body"></div></div><div className="art-caption"><span>ನಮಸ್ಕಾರ</span><span>Namaskāra — Hello</span></div></div>
        </section>
        {normalizedQuery ? <section className="content-section search-section"><SectionHeading eyebrow="YOUR SEARCH" title={`${searchResults.length} ${searchResults.length === 1 ? 'phrase' : 'phrases'} to get you started`} description={searchResults.length ? `Showing matches for “${query}”` : `No matches for “${query}” yet. Try another word or browse a category.`} />{searchResults.length ? <div className="phrase-list">{searchResults.map((phrase) => <PhraseCard key={phrase.id} phrase={phrase} />)}</div> : <EmptyState onReset={() => setQuery('')} />}</section> : <>
          <section className="content-section" id="categories"><SectionHeading eyebrow="YOUR DAY, IN KANNADA" title="Where are you headed?" description="Pick a moment. Find the words. Feel right at home." /><div className="category-grid">{categories.map((category) => <button key={category.id} className={`category-card ${category.color}`} onClick={() => openCategory(category)}><span className="category-icon"><Icon name={category.icon} size={23} /></span><span className="category-text"><strong>{category.name}</strong><small>{category.description}</small></span><span className="category-arrow"><ArrowRight size={18} /></span></button>)}</div></section>
          <section className="content-section popular-section"><div className="section-title-row"><SectionHeading eyebrow="A GOOD PLACE TO START" title="Little phrases, big difference" description="A few friendly words for wherever the day takes you." /><button className="text-link" onClick={() => openCategory(categories[0])}>Explore all phrases <ArrowRight size={16} /></button></div><div className="review-note"><span>✳</span><p>All phrases are learning drafts and have not yet been reviewed by a native Kannada speaker.</p></div><div className="phrase-list">{phrases.filter((phrase) => ['healthcare-1', 'transportation-1', 'shopping-1', 'restaurants-1'].includes(phrase.id)).map((phrase) => <PhraseCard key={phrase.id} phrase={phrase} />)}</div></section>
        </>}
      </>}
      {view === 'category' && <section className="content-section page-section"><button className="back-button" onClick={goHome}><ArrowLeft size={17} /> All categories</button><div className="page-heading"><span className={`category-icon ${activeCategory?.color}`}><Icon name={activeCategory?.icon} size={24} /></span><div><span className="eyebrow">A LITTLE MORE CONFIDENCE</span><h1>{title}</h1><p>{activeCategory?.description} Choose a phrase to practise.</p></div></div><div className="review-note"><span>✳</span><p>These phrases are a learning draft and have not been reviewed by a native speaker. Please confirm wording and pronunciation before relying on them in important situations.</p></div><div className="phrase-list">{visiblePhrases.map((phrase) => <PhraseCard key={phrase.id} phrase={phrase} />)}</div></section>}
      {view === 'conversations' && <section className="content-section page-section"><button className="back-button" onClick={goHome}><ArrowLeft size={17} /> Back to explore</button><div className="page-heading"><span className="category-icon peach"><MessageCircle size={24} /></span><div><span className="eyebrow">PRACTISE A REAL MOMENT</span><h1>{title}</h1><p>Short, practical exchanges to help a conversation get going.</p></div></div><div className="review-note"><span>✳</span><p>Conversation examples are learning drafts and have not been reviewed by a native speaker. Check them with a fluent Kannada speaker before using them in important situations.</p></div><div className="conversation-grid">{conversations.map((conversation) => <article className="conversation-card" key={conversation.id}><header><span className="conversation-icon"><Icon name={conversation.icon} size={20} /></span><h2>{conversation.title}</h2><ChevronDown size={17} /></header><div className="conversation-lines">{conversation.lines.map(([speaker, kannada, meaning, pronunciation], index) => <div className={`dialogue-line ${speaker === 'You' ? 'mine' : ''}`} key={`${conversation.id}-${index}`}><span className="speaker">{speaker}</span><p className="kannada" lang="kn">{kannada}</p><p className="meaning">{meaning}</p><small>{pronunciation}</small></div>)}</div></article>)}</div></section>}
      {view === 'quiz' && <section className="content-section page-section quiz-section">
        <div className="page-heading"><span className="category-icon mint"><Brain size={24} /></span><div><span className="eyebrow">A LITTLE PRACTICE</span><h1>Kannada quiz</h1><p>Match everyday meanings with the Kannada phrases you have learned.</p></div></div>
        {!quizQuestions.length ? <div className="quiz-start-card"><label htmlFor="quiz-category">Choose a situation</label><select id="quiz-category" value={quizCategory} onChange={(event) => setQuizCategory(event.target.value)}><option value="all">All situations</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><p>Each round has up to 10 multiple choice questions.</p><button className="nav-cta" onClick={startQuiz}>Start quiz <ArrowRight size={16} /></button></div> : quizIndex >= quizQuestions.length ? <div className="quiz-result-card"><span className="quiz-result-icon"><Check size={25} /></span><span className="eyebrow">ROUND COMPLETE</span><h2>You got {quizScore} out of {quizQuestions.length}</h2><p>{quizScore === quizQuestions.length ? 'Perfect round! You know these phrases well.' : 'Nice practice. Try another round to build your confidence.'}</p><button className="nav-cta" onClick={startQuiz}><RotateCcw size={16} /> Play again</button></div> : <article className="quiz-card">
          <div className="quiz-progress-row"><span>QUESTION {quizIndex + 1} OF {quizQuestions.length}</span><span>{quizScore} correct</span></div><div className="quiz-progress"><span style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }} /></div>
          <p className="quiz-prompt">How do you say this in Kannada?</p><h2 className="quiz-meaning">{quizQuestions[quizIndex].phrase.meaning}</h2>
          <div className="quiz-options">{quizQuestions[quizIndex].options.map((option) => {
            const isCorrect = option.id === quizQuestions[quizIndex].phrase.id
            const isSelected = quizAnswer === option.id
            const stateClass = quizAnswer ? (isCorrect ? ' correct' : isSelected ? ' incorrect' : '') : ''
            return <button key={option.id} className={`quiz-option${stateClass}`} onClick={() => answerQuiz(option)} disabled={Boolean(quizAnswer)}><span className="quiz-option-kannada" lang="kn">{option.kannada}</span><span className="quiz-option-pronunciation">{option.pronunciation}</span>{quizAnswer && isCorrect && <Check size={18} />}</button>
          })}</div>
          {quizAnswer && <div className={`quiz-feedback ${quizAnswer === quizQuestions[quizIndex].phrase.id ? 'is-correct' : 'is-incorrect'}`} role="status"><strong>{quizAnswer === quizQuestions[quizIndex].phrase.id ? 'Correct!' : 'Not quite.'}</strong><span>{quizQuestions[quizIndex].phrase.context}</span><button className="nav-cta" onClick={nextQuizQuestion}>{quizIndex === quizQuestions.length - 1 ? 'See results' : 'Next question'} <ArrowRight size={16} /></button></div>}
        </article>}
      </section>}
    </main>
    <footer className="footer"><a className="brand footer-brand" href="#home" onClick={(e) => { e.preventDefault(); goHome() }}><span className="brand-mark">ಕ</span><span>Kannada<span className="brand-accent">Mitra</span><small>Kannada for Real Life</small></span></a><p>A few words can open a whole new world.</p><span className="footer-note"><Mic2 size={15} /> Made for everyday moments in Karnataka</span></footer>
  </div>
}

function SectionHeading({ eyebrow, title, description }) { return <div className="section-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div> }
function EmptyState({ onReset }) { return <div className="empty-state"><span className="empty-icon"><Search size={23} /></span><h3>No phrases found just yet</h3><p>Try a different English word or Kannada phrase, or browse a category to explore.</p><button className="nav-cta" onClick={onReset}>Clear search <X size={15} /></button></div> }
