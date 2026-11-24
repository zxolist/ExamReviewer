// RywReviewer Engine - app.js
// Production-Ready Exam Review Web Application

class ExamApp {
  constructor() {
    // Multi-Subject & Lesson Architecture
    this.subjectsData = typeof SUBJECTS_DATA !== 'undefined' ? SUBJECTS_DATA : {
      thurakid: { id: 'thurakid', name: 'การประกอบธุรกิจ ม.5', questions: typeof QUESTIONS_DATA !== 'undefined' ? QUESTIONS_DATA : [] }
    };

    // Load custom subjects if any
    try {
      const customSub = JSON.parse(localStorage.getItem('rywreviewer_custom_subjects') || '{}');
      Object.assign(this.subjectsData, customSub);
    } catch (e) {}

    this.currentSubject = localStorage.getItem('rywreviewer_active_subject') || 'thurakid';
    if (!this.subjectsData[this.currentSubject]) this.currentSubject = 'thurakid';
    this.currentLesson = 'all';

    this.allQuestions = this.subjectsData[this.currentSubject].questions || [];
    this.quizQuestions = [];
    this.currentIndex = 0;
    this.userAnswers = {}; // { [qId]: { selected: number, isCorrect: boolean } }
    this.bookmarkedIds = new Set(JSON.parse(localStorage.getItem('rywreviewer_bookmarks') || localStorage.getItem('bizexam_bookmarks') || '[]'));
    this.eliminatedChoices = {}; // { [qId]: Set of eliminated indices }
    this.streakCount = 0;
    this.maxStreak = 0;
    this.exp = parseInt(localStorage.getItem('rywreviewer_exp') || '0', 10);

    // Config state
    this.config = {
      difficulty: 'all',
      count: 20,
      mode: 'practice', // 'practice' or 'exam'
      shuffleQuestions: true,
      soundEnabled: true
    };

    // Timer state
    this.startTime = null;
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.examTimeLimitSeconds = 0; // 0 = elapsed, >0 = countdown
    this.isSubmitted = false;

    // Active Navigation Tab: 'quiz', 'flashcards', 'cheatsheet', 'search'
    this.activeTab = 'quiz';

    // Flashcard State
    this.flashcardIndex = 0;
    this.flashcardMastered = new Set();

    // Audio Context
    this.audioCtx = null;

    // Confetti Engine
    this.confettiCanvas = null;
    this.confettiCtx = null;
    this.confettiParticles = [];
    this.confettiAnimId = null;

    // Device Mode State ('mobile' or 'pc')
    const savedDevice = localStorage.getItem('rywreviewer_device_mode') || (window.innerWidth <= 768 ? 'mobile' : 'pc');
    this.deviceMode = savedDevice;
    this.wizardState = {
      device: savedDevice,
      difficulty: 'all',
      count: 20,
      mode: 'practice'
    };

    this.initElements();
    this.bindEvents();
    this.loadTheme();
    this.setDeviceMode(savedDevice);
    this.setupConfetti();
    this.initCheatSheet();
    this.initSearchBank();
    this.initSubjectSystem();
    this.nickname = localStorage.getItem('rywreviewer_nickname') || '';
    this.updateNicknameUI();
    this.updateLevelUI();
    this.updateWeakSpotUI();
    this.updateSubjectMasteryUI();
    this.initFlashcardSwipe();

    // First time visitor check: open Device Mode setting if never chosen, else ask nickname
    setTimeout(() => {
      const hasChosenDevice = localStorage.getItem('rywreviewer_device_mode');
      const hasNickname = localStorage.getItem('rywreviewer_nickname');
      if (!hasChosenDevice) {
        this.openWizard();
      } else if (!hasNickname) {
        this.openNicknameModal();
      }
    }, 350);
  }

  initElements() {
    // Nickname Modal Elements
    this.nicknameModal = document.getElementById('nickname-modal');
    this.nicknameInput = document.getElementById('nickname-input');
    this.btnSaveNickname = document.getElementById('btn-save-nickname');
    this.btnSkipNickname = document.getElementById('btn-skip-nickname');
    this.btnCloseNickname = document.getElementById('btn-close-nickname');
    this.btnHeroProfile = document.getElementById('btn-hero-profile');
    this.playerProfileBadge = document.getElementById('player-profile-badge');

    // Device Settings Modal Elements
    this.wizardModal = document.getElementById('wizard-modal');
    this.btnCloseWizard = document.getElementById('btn-close-wizard');
    this.btnReopenWizard = document.getElementById('btn-reopen-wizard');
    this.btnHeroWizard = document.getElementById('btn-hero-wizard');
    this.btnSaveDeviceMode = document.getElementById('btn-save-device-mode');
    this.btnCancelDeviceMode = document.getElementById('btn-cancel-device-mode');

    if (this.wizardModal) {
      this.wizardModal.addEventListener('click', (e) => {
        if (e.target === this.wizardModal) {
          this.closeWizard();
        }
      });
    }

    // Screens in Quiz Tab
    this.screenSetup = document.getElementById('screen-setup');
    this.screenQuiz = document.getElementById('screen-quiz');
    this.screenResult = document.getElementById('screen-result');

    // Tab Views
    this.tabViewQuiz = document.getElementById('tab-view-quiz');
    this.tabViewFlashcards = document.getElementById('tab-view-flashcards');
    this.tabViewLearn = document.getElementById('tab-view-learn');
    this.tabViewCheatsheet = this.tabViewLearn;
    this.tabViewSearch = document.getElementById('tab-view-search');

    // Upper Stats Bar
    this.upperStatsBar = document.getElementById('upper-stats-bar');
    this.statCorrectEl = document.getElementById('stat-correct');
    this.statWrongEl = document.getElementById('stat-wrong');
    this.statCorrectContainer = document.getElementById('stat-correct-container');
    this.statWrongContainer = document.getElementById('stat-wrong-container');
    this.statExamProgressContainer = document.getElementById('stat-exam-progress-container');
    this.statExamAnswered = document.getElementById('stat-exam-answered');
    this.statExamRemaining = document.getElementById('stat-exam-remaining');
    this.statProgressTextEl = document.getElementById('stat-progress-text');
    this.progressBarFill = document.getElementById('progress-bar-fill');
    this.timerDisplay = document.getElementById('timer-display');
    this.streakPill = document.getElementById('streak-pill');
    this.streakCountEl = document.getElementById('streak-count');

    // Exit buttons
    this.btnExitUpper = document.getElementById('btn-exit-upper');
    this.btnExitTool = document.getElementById('btn-exit-tool');
    this.cuteExitModal = document.getElementById('cute-exit-modal');
    this.btnConfirmExit = document.getElementById('btn-confirm-exit');
    this.btnCancelExit = document.getElementById('btn-cancel-exit');
    this.navHintBox = document.getElementById('nav-hint-box');

    // Home button elements
    this.btnHomeLogo = document.getElementById('btn-home-logo');
    this.btnUpperHome = document.getElementById('btn-upper-home');
    this.cuteHomeModal = document.getElementById('cute-home-modal');
    this.btnConfirmGoHome = document.getElementById('btn-confirm-go-home');
    this.btnHomeViewTutorial = document.getElementById('btn-home-view-tutorial');
    this.btnCancelGoHome = document.getElementById('btn-cancel-go-home');

    // Tutorial elements
    this.tutorialModal = document.getElementById('tutorial-modal');
    this.btnOpenTutorial = document.getElementById('btn-open-tutorial');
    this.btnHeroTutorial = document.getElementById('btn-hero-tutorial');
    this.btnCloseTutorialX = document.getElementById('btn-close-tutorial-x');
    this.btnTutorialPrevStep = document.getElementById('btn-tutorial-prev-step');
    this.btnTutorialNextStep = document.getElementById('btn-tutorial-next-step');
    this.btnTutorialStartNow = document.getElementById('btn-tutorial-start-now');
    this.currentTutorialStep = 1;

    // Question Screen elements
    this.badgeCategory = document.getElementById('badge-category');
    this.badgeDifficulty = document.getElementById('badge-difficulty');
    this.questionNumberEl = document.getElementById('question-number');
    this.btnBookmark = document.getElementById('btn-bookmark');
    this.btnSpeak = document.getElementById('btn-speak');
    this.btnFiftyFifty = document.getElementById('btn-fifty-fifty');
    this.questionTextEl = document.getElementById('question-text');
    this.choicesContainer = document.getElementById('choices-container');
    this.explanationBox = document.getElementById('explanation-box');
    this.explanationHeaderTitle = document.getElementById('explanation-header-title');
    this.explanationText = document.getElementById('explanation-text');
    this.btnExplNext = document.getElementById('btn-expl-next');

    // Nav buttons
    this.btnPrev = document.getElementById('btn-prev');
    this.btnNext = document.getElementById('btn-next');
    this.btnFinish = document.getElementById('btn-finish');
    this.btnPaletteToggle = document.getElementById('btn-palette-toggle');

    // Palette Modal
    this.paletteModal = document.getElementById('palette-modal');
    this.paletteGrid = document.getElementById('palette-grid');
    this.btnClosePalette = document.getElementById('btn-close-palette');

    // Results Elements
    this.resultScore = document.getElementById('result-score');
    this.resultTotal = document.getElementById('result-total');
    this.resultPercentage = document.getElementById('result-percentage');
    this.scoreCircleProgress = document.getElementById('score-circle-progress');
    this.resultGradeBadge = document.getElementById('result-grade-badge');
    this.resultFeedback = document.getElementById('result-feedback');
    this.metricCorrect = document.getElementById('metric-correct');
    this.metricWrong = document.getElementById('metric-wrong');
    this.metricAccuracy = document.getElementById('metric-accuracy');
    this.metricTime = document.getElementById('metric-time');
    this.btnRetryAll = document.getElementById('btn-retry-all');
    this.btnRetryWrong = document.getElementById('btn-retry-wrong');
    this.btnShareScore = document.getElementById('btn-share-score');
    this.btnBackSetup = document.getElementById('btn-back-setup');
    this.reviewListContainer = document.getElementById('review-list-container');

    // Cute Result Modal Elements
    this.cuteResultModal = document.getElementById('cute-result-modal');
    this.cuteResultCard = document.getElementById('cute-result-card');
    this.cuteMascotBadge = document.getElementById('cute-mascot-badge');
    this.cuteModalTitle = document.getElementById('cute-modal-title');
    this.cuteModalScorePill = document.getElementById('cute-modal-score-pill');
    this.cuteModalScoreText = document.getElementById('cute-modal-score-text');
    this.cuteModalDesc = document.getElementById('cute-modal-desc');
    this.btnCuteRetryWrong = document.getElementById('btn-cute-retry-wrong');
    this.btnCuteViewReview = document.getElementById('btn-cute-view-review');
    this.btnCuteRetryAll = document.getElementById('btn-cute-retry-all');

    // Flashcard Elements
    this.flashcardCard = document.getElementById('flashcard-card');
    this.flashcardCategory = document.getElementById('flashcard-category');
    this.flashcardDifficulty = document.getElementById('flashcard-difficulty');
    this.flashcardQuestion = document.getElementById('flashcard-question');
    this.flashcardAnswer = document.getElementById('flashcard-answer');
    this.flashcardExplanation = document.getElementById('flashcard-explanation');
    this.flashcardCounter = document.getElementById('flashcard-counter');
    this.flashcardMasteredBadge = document.getElementById('flashcard-mastered-badge');
    this.btnFlashPrev = document.getElementById('btn-flash-prev');
    this.btnFlashNext = document.getElementById('btn-flash-next');
    this.btnFlashMaster = document.getElementById('btn-flash-master');
    this.btnFlashShuffle = document.getElementById('btn-flash-shuffle');
  }

  bindEvents() {
    // Nickname Modal bindings
    if (this.nicknameModal) {
      this.nicknameModal.addEventListener('click', (e) => {
        if (e.target === this.nicknameModal) {
          this.closeNicknameModal();
        }
      });
    }
    if (this.btnSaveNickname) {
      this.btnSaveNickname.addEventListener('click', () => this.saveNickname());
    }
    if (this.btnSkipNickname) {
      this.btnSkipNickname.addEventListener('click', () => this.closeNicknameModal());
    }
    if (this.btnCloseNickname) {
      this.btnCloseNickname.addEventListener('click', () => this.closeNicknameModal());
    }
    if (this.btnHeroProfile) {
      this.btnHeroProfile.addEventListener('click', () => this.openNicknameModal());
    }
    if (this.playerProfileBadge) {
      this.playerProfileBadge.addEventListener('click', () => this.openNicknameModal());
    }
    if (this.nicknameInput) {
      this.nicknameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.saveNickname();
        }
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Weak spot drill button
    const btnWeakSpot = document.getElementById('btn-weak-spot-drill');
    if (btnWeakSpot) {
      btnWeakSpot.addEventListener('click', () => this.startWeakSpotDrill());
    }

    // Tab Navigation
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // Config: Difficulty cards
    document.querySelectorAll('.difficulty-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.difficulty-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.config.difficulty = card.dataset.difficulty;
        this.updateAvailableCounts();
        this.playSound('click');
      });
    });

    // Config: Mode cards
    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.config.mode = card.dataset.mode;
        this.playSound('click');
      });
    });

    // Config: Question Count pills
    document.querySelectorAll('.count-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.count-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.config.count = pill.dataset.count === 'all' ? 9999 : parseInt(pill.dataset.count, 10);
        this.playSound('click');
      });
    });

    // Config: Toggles
    const toggleShuffleQ = document.getElementById('toggle-shuffle-q');
    if (toggleShuffleQ) {
      toggleShuffleQ.addEventListener('change', (e) => {
        this.config.shuffleQuestions = e.target.checked;
      });
    }

    const toggleSound = document.getElementById('toggle-sound');
    if (toggleSound) {
      toggleSound.addEventListener('change', (e) => {
        this.config.soundEnabled = e.target.checked;
      });
    }

    // Start Button
    const btnStart = document.getElementById('btn-start-quiz');
    if (btnStart) {
      btnStart.addEventListener('click', () => this.startQuiz());
    }

    // Device Settings Modal Handlers
    if (this.btnReopenWizard) this.btnReopenWizard.addEventListener('click', () => this.openWizard());
    if (this.btnHeroWizard) this.btnHeroWizard.addEventListener('click', () => this.openWizard());
    if (this.btnCloseWizard) this.btnCloseWizard.addEventListener('click', () => this.closeWizard());
    if (this.btnCancelDeviceMode) this.btnCancelDeviceMode.addEventListener('click', () => this.closeWizard());
    if (this.btnSaveDeviceMode) this.btnSaveDeviceMode.addEventListener('click', () => this.saveDeviceMode());

    // Device Option Card Choices in Modal
    document.querySelectorAll('.wizard-device-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.wizard-device-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.wizardState.device = card.dataset.device;
        this.playSound('click');
      });
    });

    // Exit Button Handlers
    const openExitModal = () => {
      this.playSound('click');
      this.cuteExitModal.classList.add('active');
    };
    if (this.btnExitUpper) this.btnExitUpper.addEventListener('click', openExitModal);
    if (this.btnExitTool) this.btnExitTool.addEventListener('click', openExitModal);

    if (this.btnConfirmExit) {
      this.btnConfirmExit.addEventListener('click', () => {
        this.cuteExitModal.classList.remove('active');
        this.showSetupScreen();
      });
    }

    if (this.btnCancelExit) {
      this.btnCancelExit.addEventListener('click', () => {
        this.cuteExitModal.classList.remove('active');
        this.playSound('click');
      });
    }

    // Home Button Handlers (Return home anytime, even during review/exam)
    const onHomeClicked = () => this.handleHomeClick();
    if (this.btnHomeLogo) {
      this.btnHomeLogo.addEventListener('click', onHomeClicked);
      this.btnHomeLogo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onHomeClicked();
        }
      });
    }
    if (this.btnUpperHome) {
      this.btnUpperHome.addEventListener('click', onHomeClicked);
    }

    if (this.btnConfirmGoHome) {
      this.btnConfirmGoHome.addEventListener('click', () => {
        if (this.cuteHomeModal) this.cuteHomeModal.classList.remove('active');
        this.goHome();
      });
    }

    if (this.btnHomeViewTutorial) {
      this.btnHomeViewTutorial.addEventListener('click', () => {
        if (this.cuteHomeModal) this.cuteHomeModal.classList.remove('active');
        this.openTutorial(4); // Highlights step 4: Home button feature!
      });
    }

    if (this.btnCancelGoHome) {
      this.btnCancelGoHome.addEventListener('click', () => {
        if (this.cuteHomeModal) this.cuteHomeModal.classList.remove('active');
        this.playSound('click');
      });
    }

    // Tutorial Handlers
    if (this.btnOpenTutorial) {
      this.btnOpenTutorial.addEventListener('click', () => this.openTutorial(1));
    }
    if (this.btnHeroTutorial) {
      this.btnHeroTutorial.addEventListener('click', () => this.openTutorial(1));
    }
    if (this.btnCloseTutorialX) {
      this.btnCloseTutorialX.addEventListener('click', () => this.closeTutorial());
    }
    if (this.btnTutorialStartNow) {
      this.btnTutorialStartNow.addEventListener('click', () => {
        this.closeTutorial();
        this.goHome();
      });
    }
    if (this.btnTutorialPrevStep) {
      this.btnTutorialPrevStep.addEventListener('click', () => {
        this.setTutorialStep(this.currentTutorialStep - 1);
      });
    }
    if (this.btnTutorialNextStep) {
      this.btnTutorialNextStep.addEventListener('click', () => {
        if (this.currentTutorialStep >= 8) {
          this.closeTutorial();
        } else {
          this.setTutorialStep(this.currentTutorialStep + 1);
        }
      });
    }

    // Tutorial Tab buttons
    document.querySelectorAll('.tutorial-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step, 10);
        this.setTutorialStep(step);
      });
    });

    // Learn Tab & Study Banner Handlers
    const bannerLearn = document.getElementById('banner-learn-before-test');
    if (bannerLearn) {
      bannerLearn.addEventListener('click', () => {
        this.switchTab('learn');
      });
    }

    const btnLearnStartQuiz = document.getElementById('btn-learn-start-quiz');
    if (btnLearnStartQuiz) {
      btnLearnStartQuiz.addEventListener('click', () => {
        this.switchTab('quiz');
        this.showSetupScreen();
      });
    }

    const btnHistoryStartTestNow = document.getElementById('btn-history-start-test-now');
    if (btnHistoryStartTestNow) {
      btnHistoryStartTestNow.addEventListener('click', () => {
        this.switchTab('quiz');
        this.showSetupScreen();
      });
    }

    document.querySelectorAll('.learn-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.learn-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterLearnChapter(btn.dataset.chapter);
        this.playSound('click');
      });
    });

    const learnSearchBox = document.getElementById('learn-search-box');
    const btnClearLearnSearch = document.getElementById('btn-clear-learn-search');
    let learnDebounceTimer = null;
    if (learnSearchBox) {
      learnSearchBox.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        if (btnClearLearnSearch) btnClearLearnSearch.style.display = term ? 'inline' : 'none';
        clearTimeout(learnDebounceTimer);
        learnDebounceTimer = setTimeout(() => this.filterLearnSearch(term), 120);
      });
    }
    if (btnClearLearnSearch) {
      btnClearLearnSearch.addEventListener('click', () => {
        if (learnSearchBox) {
          learnSearchBox.value = '';
          this.filterLearnSearch('');
        }
        btnClearLearnSearch.style.display = 'none';
      });
    }

    // Navigation buttons
    this.btnPrev.addEventListener('click', () => this.navigate(-1));
    this.btnNext.addEventListener('click', () => this.navigate(1));
    this.btnFinish.addEventListener('click', () => this.finishQuiz());

    // Tools inside Quiz
    this.btnBookmark.addEventListener('click', () => this.toggleBookmark());
    this.btnSpeak.addEventListener('click', () => this.speakQuestion());
    this.btnFiftyFifty.addEventListener('click', () => this.triggerFiftyFifty());
    this.btnExplNext.addEventListener('click', () => this.navigate(1));

    // Palette modal toggle
    this.btnPaletteToggle.addEventListener('click', () => this.openPalette());
    this.btnClosePalette.addEventListener('click', () => this.closePalette());
    this.paletteModal.addEventListener('click', (e) => {
      if (e.target === this.paletteModal) this.closePalette();
    });

    // Result action buttons
    this.btnRetryAll.addEventListener('click', () => this.restartQuiz(false));
    this.btnRetryWrong.addEventListener('click', () => this.restartQuiz(true));
    this.btnBackSetup.addEventListener('click', () => this.showSetupScreen());
    this.btnShareScore.addEventListener('click', () => this.shareScore());

    // Cute Result Modal Buttons
    if (this.btnCuteRetryWrong) {
      this.btnCuteRetryWrong.addEventListener('click', () => {
        this.cuteResultModal.classList.remove('active');
        this.restartQuiz(true);
      });
    }
    if (this.btnCuteViewReview) {
      this.btnCuteViewReview.addEventListener('click', () => {
        this.cuteResultModal.classList.remove('active');
        this.playSound('click');
      });
    }
    if (this.btnCuteRetryAll) {
      this.btnCuteRetryAll.addEventListener('click', () => {
        this.cuteResultModal.classList.remove('active');
        this.restartQuiz(false);
      });
    }
    this.cuteResultModal.addEventListener('click', (e) => {
      if (e.target === this.cuteResultModal) {
        this.cuteResultModal.classList.remove('active');
      }
    });

    // Review filter tabs
    document.querySelectorAll('.review-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.review-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderReviewList(tab.dataset.filter);
        this.playSound('click');
      });
    });

    // Flashcard bindings
    this.flashcardCard.addEventListener('click', () => {
      this.flashcardCard.classList.toggle('flipped');
      this.playSound('click');
    });
    this.btnFlashPrev.addEventListener('click', () => this.navigateFlashcard(-1));
    this.btnFlashNext.addEventListener('click', () => this.navigateFlashcard(1));
    this.btnFlashMaster.addEventListener('click', () => this.toggleFlashcardMastered());
    this.btnFlashShuffle.addEventListener('click', () => this.shuffleFlashcards());

    // Search input (debounced for optimal performance)
    const searchInput = document.getElementById('search-input');
    const searchFilter = document.getElementById('search-difficulty-filter');
    let searchDebounceTimer = null;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => this.filterSearchBank(), 120);
      });
    }
    if (searchFilter) searchFilter.addEventListener('change', () => this.filterSearchBank());

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  // --- AUDIO SYNTHESIS ENGINE (Pure Web Audio API) ---
  playSound(type) {
    if (!this.config || !this.config.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      const connectAndClean = (osc, gain, stopTime) => {
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(stopTime);
        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (e) {}
        };
      };

      if (type === 'click') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        connectAndClean(osc, gain, now + 0.04);
      } else if (type === 'correct') {
        // Dual chord (E5 + B5)
        [659.25, 987.77].forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.08, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
          connectAndClean(osc, gain, now + idx * 0.06 + 0.25);
        });
      } else if (type === 'streak') {
        // Ascending 3-note chime (C5, E5, G5)
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.1, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
          connectAndClean(osc, gain, now + idx * 0.08 + 0.3);
        });
      } else if (type === 'wrong') {
        // Low gentle thud
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        connectAndClean(osc, gain, now + 0.25);
      } else if (type === 'fanfare') {
        // Victory 4-note chord
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.08, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
          connectAndClean(osc, gain, now + idx * 0.1 + 0.5);
        });
      }
    } catch (e) {
      // Audio not supported or blocked
    }
  }

  // --- CONFETTI ENGINE (Pure Canvas) ---
  setupConfetti() {
    this.confettiCanvas = document.getElementById('confetti-canvas');
    if (!this.confettiCanvas) return;
    this.confettiCtx = this.confettiCanvas.getContext('2d');
    const resize = () => {
      this.confettiCanvas.width = window.innerWidth;
      this.confettiCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();
  }

  launchConfetti() {
    if (!this.confettiCtx || !this.confettiCanvas) return;
    this.confettiCanvas.style.display = 'block';
    this.confettiParticles = [];
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
    const count = 100;

    for (let i = 0; i < count; i++) {
      this.confettiParticles.push({
        x: Math.random() * this.confettiCanvas.width,
        y: -10 - Math.random() * 200,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: -3 + Math.random() * 6,
        vy: 3 + Math.random() * 5,
        rotation: Math.random() * 360,
        vRot: -6 + Math.random() * 12
      });
    }

    if (this.confettiAnimId) cancelAnimationFrame(this.confettiAnimId);
    let frames = 0;

    const render = () => {
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
      this.confettiParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        this.confettiCtx.save();
        this.confettiCtx.translate(p.x, p.y);
        this.confettiCtx.rotate((p.rotation * Math.PI) / 180);
        this.confettiCtx.fillStyle = p.color;
        this.confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.confettiCtx.restore();
      });

      frames++;
      if (frames < 200) {
        this.confettiAnimId = requestAnimationFrame(render);
      } else {
        this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        this.confettiCanvas.style.display = 'none';
      }
    };

    render();
  }

  // --- TAB SWITCHER ---
  switchTab(tab) {
    if (tab === 'cheatsheet') tab = 'learn';
    this.activeTab = tab;
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab || (tab === 'learn' && btn.dataset.tab === 'cheatsheet'));
    });

    this.tabViewQuiz.style.display = tab === 'quiz' ? 'block' : 'none';
    this.tabViewFlashcards.style.display = tab === 'flashcards' ? 'block' : 'none';
    if (this.tabViewLearn) this.tabViewLearn.style.display = (tab === 'learn' || tab === 'cheatsheet') ? 'block' : 'none';
    this.tabViewSearch.style.display = tab === 'search' ? 'block' : 'none';

    // Show upper stats only when in quiz and quiz screen is visible
    if (tab === 'quiz' && this.screenQuiz.style.display === 'block') {
      this.upperStatsBar.style.display = 'block';
    } else {
      this.upperStatsBar.style.display = 'none';
    }

    if (tab === 'flashcards') {
      this.renderFlashcard();
    }

    this.playSound('click');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- QUIZ SETUP & FLOW ---
  updateAvailableCounts() {
    let pool = this.allQuestions;
    if (this.config.difficulty !== 'all') {
      pool = pool.filter(q => q.difficulty === this.config.difficulty);
    }
    const maxCount = pool.length;

    let hasSelectedValid = false;
    document.querySelectorAll('.count-pill').forEach(pill => {
      const c = pill.dataset.count;
      if (c === 'all') {
        pill.textContent = `ทั้งหมด (${maxCount})`;
      } else {
        const num = parseInt(c, 10);
        if (num > maxCount) {
          pill.style.opacity = '0.35';
          pill.style.pointerEvents = 'none';
          if (pill.classList.contains('active')) {
            pill.classList.remove('active');
          }
        } else {
          pill.style.opacity = '1';
          pill.style.pointerEvents = 'auto';
          if (pill.classList.contains('active')) {
            hasSelectedValid = true;
          }
        }
      }
    });

    // Auto-select valid pill if previous selection exceeded maxCount
    if (!hasSelectedValid) {
      const allPill = document.querySelector('.count-pill[data-count="all"]');
      if (allPill) {
        allPill.classList.add('active');
        this.config.count = 9999;
      }
    }
  }

  // --- DEVICE SETTINGS MODAL METHODS ---
  openWizard() {
    const currentMode = this.deviceMode || 'mobile';
    document.querySelectorAll('.wizard-device-card').forEach(card => {
      card.classList.toggle('active', card.dataset.device === currentMode);
    });
    if (this.wizardModal) {
      this.wizardModal.style.display = 'flex';
      this.wizardModal.classList.add('active');
      try { this.playSound('click'); } catch (e) {}
    }
  }

  closeWizard() {
    if (this.wizardModal) {
      this.wizardModal.classList.remove('active');
      this.wizardModal.style.display = 'none';
      try { this.playSound('click'); } catch (e) {}
    }
    if (!localStorage.getItem('rywreviewer_nickname')) {
      setTimeout(() => this.openNicknameModal(), 200);
    }
  }

  saveDeviceMode() {
    const activeCard = document.querySelector('.wizard-device-card.active');
    const mode = activeCard ? activeCard.dataset.device : (this.deviceMode || 'mobile');
    this.setDeviceMode(mode);
    this.closeWizard();
    try { this.playSound('correct'); } catch (e) {}
  }

  setDeviceMode(mode) {
    this.deviceMode = mode;
    this.wizardState.device = mode;
    localStorage.setItem('rywreviewer_device_mode', mode);
    localStorage.setItem('rywreviewer_onboarded_v2', 'true');

    if (mode === 'mobile') {
      document.body.classList.add('mobile-ui');
      document.body.classList.remove('pc-ui');
    } else {
      document.body.classList.remove('mobile-ui');
      document.body.classList.add('pc-ui');
    }

    if (this.btnReopenWizard) {
      this.btnReopenWizard.innerHTML = mode === 'mobile' ? '<span>📱 โหมดมือถือ</span>' : '<span>💻 โหมดคอม</span>';
      this.btnReopenWizard.title = `โหมดปัจจุบัน: ${mode === 'mobile' ? 'มือถือ' : 'คอมพิวเตอร์'} (คลิกเพื่อเปลี่ยน)`;
    }

    document.querySelectorAll('.wizard-device-card').forEach(card => {
      card.classList.toggle('active', card.dataset.device === mode);
    });
  }

  startQuiz(customQuestions = null) {
    const letters = ['ก', 'ข', 'ค', 'ง'];

    if (customQuestions) {
      // Re-randomize choices order for custom retry questions so students truly understand
      this.quizQuestions = customQuestions.map(q => {
        const correctChoiceText = q.choices[q.answer];
        const shuffledChoices = this.shuffleArray(q.choices);
        const newAnswerIdx = shuffledChoices.indexOf(correctChoiceText);
        return {
          ...q,
          choices: shuffledChoices,
          answer: newAnswerIdx,
          answer_letter: letters[newAnswerIdx]
        };
      });
    } else {
      let pool = [...this.allQuestions];
      if (this.currentLesson && this.currentLesson !== 'all') {
        pool = pool.filter(q => q.lesson_id === this.currentLesson);
      }
      if (this.config.difficulty !== 'all') {
        pool = pool.filter(q => q.difficulty === this.config.difficulty);
      }

      // 1. Random a new number of quiz / question order:
      pool = this.shuffleArray(pool);
      const limit = Math.min(this.config.count, pool.length);
      const chosen = pool.slice(0, limit);

      // 2. Random a new choice order for every question (so ก, ข, ค, ง move every time!):
      this.quizQuestions = chosen.map(q => {
        const correctChoiceText = q.choices[q.answer];
        const shuffledChoices = this.shuffleArray(q.choices);
        const newAnswerIdx = shuffledChoices.indexOf(correctChoiceText);
        return {
          ...q,
          choices: shuffledChoices,
          answer: newAnswerIdx,
          answer_letter: letters[newAnswerIdx]
        };
      });
    }

    if (this.quizQuestions.length === 0) {
      alert("ไม่มีคำถามในหมวดหมู่นี้");
      return;
    }

    this.currentIndex = 0;
    this.userAnswers = {};
    this.eliminatedChoices = {};
    this.streakCount = 0;
    this.maxStreak = 0;
    this.isSubmitted = false;
    this.elapsedSeconds = 0;
    this.startTime = Date.now();

    // Mode specific timer: in Exam mode, set 1.5 minutes per question
    if (this.config.mode === 'exam') {
      this.examTimeLimitSeconds = this.quizQuestions.length * 90; // 90s per question
    } else {
      this.examTimeLimitSeconds = 0;
    }

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateTimerDisplay();
    }, 1000);

    // Speedrun Mode setup
    this.speedrunTimerContainer = document.getElementById('speedrun-timer-container');
    this.speedrunSecondsEl = document.getElementById('speedrun-seconds');
    if (this.speedrunInterval) {
      clearInterval(this.speedrunInterval);
      this.speedrunInterval = null;
    }

    if (this.config.mode === 'speedrun') {
      this.speedrunSecondsLeft = 60;
      if (this.speedrunTimerContainer) this.speedrunTimerContainer.style.display = 'inline-flex';
      if (this.speedrunSecondsEl) this.speedrunSecondsEl.textContent = '60s';

      this.speedrunInterval = setInterval(() => {
        this.speedrunSecondsLeft--;
        if (this.speedrunSecondsEl) {
          this.speedrunSecondsEl.textContent = `${this.speedrunSecondsLeft}s`;
        }
        if (this.speedrunSecondsLeft <= 0) {
          clearInterval(this.speedrunInterval);
          this.speedrunInterval = null;
          this.finishQuiz(true);
        }
      }, 1000);
    } else {
      if (this.speedrunTimerContainer) this.speedrunTimerContainer.style.display = 'none';
    }

    // Switch View
    this.screenSetup.style.display = 'none';
    this.screenResult.style.display = 'none';
    this.screenQuiz.style.display = 'block';
    this.upperStatsBar.style.display = 'block';

    this.updateUpperStats();
    this.renderQuestion();
    this.playSound('click');
  }

  renderQuestion() {
    const q = this.quizQuestions[this.currentIndex];
    const total = this.quizQuestions.length;
    const answered = this.userAnswers[q.id];
    const eliminated = this.eliminatedChoices[q.id] || new Set();

    // Meta badges
    this.badgeCategory.textContent = q.category;
    this.badgeDifficulty.textContent = q.difficulty_label;
    this.badgeDifficulty.className = `badge badge-${q.difficulty}`;
    this.questionNumberEl.textContent = `ข้อที่ ${this.currentIndex + 1} จาก ${total}`;

    // Bookmark state
    if (this.bookmarkedIds.has(q.id)) {
      this.btnBookmark.classList.add('active');
      this.btnBookmark.innerHTML = `⭐ ติดดาวแล้ว`;
    } else {
      this.btnBookmark.classList.remove('active');
      this.btnBookmark.innerHTML = `☆ ติดดาว`;
    }

    // 50:50 button state
    if (!answered) {
      this.btnFiftyFifty.style.display = 'inline-flex';
      this.btnFiftyFifty.disabled = eliminated.size > 0;
      this.btnFiftyFifty.style.opacity = eliminated.size > 0 ? '0.4' : '1';
    } else {
      this.btnFiftyFifty.style.display = 'none';
    }

    // Question Text
    this.questionTextEl.textContent = `${this.currentIndex + 1}. ${q.question}`;

    // Render Choices
    this.choicesContainer.innerHTML = '';
    const letters = ['ก', 'ข', 'ค', 'ง'];

    q.choices.forEach((choiceText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.dataset.index = idx;

      if (eliminated.has(idx)) {
        btn.classList.add('eliminated');
      }

      const keySpan = document.createElement('span');
      keySpan.className = 'choice-key';
      keySpan.textContent = letters[idx];

      const textSpan = document.createElement('span');
      textSpan.className = 'choice-text';
      textSpan.textContent = choiceText;

      btn.appendChild(keySpan);
      btn.appendChild(textSpan);

      // Instant Visual Feedback when answered:
      // Always show right (green) or wrong (red) and reveal correct choice!
      if (answered !== undefined) {
        if (idx === q.answer) {
          btn.classList.add('correct-choice');
          const checkMark = document.createElement('span');
          checkMark.style = 'color:#059669; font-weight:800; font-size:1.1rem; margin-left:auto;';
          checkMark.textContent = '✓';
          btn.appendChild(checkMark);
        } else if (idx === answered.selected) {
          btn.classList.add('wrong-choice');
          const crossMark = document.createElement('span');
          crossMark.style = 'color:#dc2626; font-weight:800; font-size:1.1rem; margin-left:auto;';
          crossMark.textContent = '✗';
          btn.appendChild(crossMark);
        }
        btn.classList.add('disabled');
      }

      btn.addEventListener('click', () => this.handleAnswerSelect(q, idx));
      this.choicesContainer.appendChild(btn);
    });

    // Prominent Thai Explanation Box:
    // When answered, immediately explain why the answer is correct!
    if (answered !== undefined) {
      this.explanationBox.style.display = 'block';
      this.explanationHeaderTitle.innerHTML = answered.isCorrect
        ? `<span>🎉 เยี่ยมมาก! ตอบถูกต้อง (คำตอบคือข้อ ${q.answer_letter})</span>`
        : `<span>💡 ข้อนี้ตอบ <strong>ข้อ ${q.answer_letter}. ${q.choices[q.answer]}</strong> (คำอธิบายเฉลย)</span>`;
      
      this.explanationText.innerHTML = `<strong>เหตุผลที่ถูกต้อง:</strong> ${q.explanation || 'ไม่มีคำอธิบายเพิ่มเติม'}`;
      
      // Auto scroll to explanation on mobile only if not already in viewport
      if (window.innerWidth < 768 && this.explanationBox) {
        setTimeout(() => {
          const rect = this.explanationBox.getBoundingClientRect();
          if (rect.bottom > window.innerHeight || rect.top < 0) {
            this.explanationBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 80);
      }
    } else {
      this.explanationBox.style.display = 'none';
    }

    // Nav controls state: Next button is strictly locked until a choice is selected
    const isCurrentAnswered = answered !== undefined;

    this.btnPrev.disabled = this.currentIndex === 0;
    this.btnPrev.style.opacity = this.currentIndex === 0 ? '0.4' : '1';

    if (this.currentIndex === total - 1) {
      this.btnNext.style.display = 'none';
      this.btnFinish.style.display = 'inline-flex';
      this.btnFinish.disabled = !isCurrentAnswered;
      this.btnFinish.classList.toggle('disabled', !isCurrentAnswered);
    } else {
      this.btnNext.style.display = 'inline-flex';
      this.btnNext.disabled = !isCurrentAnswered;
      this.btnNext.classList.toggle('disabled', !isCurrentAnswered);
      this.btnFinish.style.display = 'none';
    }

    if (this.navHintBox) {
      this.navHintBox.style.display = 'none';
    }

    this.updateUpperStats();
  }

  handleAnswerSelect(q, choiceIndex) {
    if (this.isSubmitted) return;
    
    // Lock once answered to prevent spam clicking
    if (this.userAnswers[q.id] !== undefined) {
      return;
    }

    const isCorrect = choiceIndex === q.answer;
    this.userAnswers[q.id] = {
      selected: choiceIndex,
      isCorrect: isCorrect,
      question: q
    };

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(isCorrect ? [25] : [50, 40, 50]);
    }

    // Track weak spot & subject stats
    this.recordQuestionResult(q, isCorrect);

    // Sound, EXP & Streak feedback
    if (isCorrect) {
      this.gainExp(10, 'ตอบถูก!');
      this.streakCount++;
      if (this.streakCount > this.maxStreak) this.maxStreak = this.streakCount;
      if (this.streakCount >= 3) {
        this.playSound('streak');
      } else {
        this.playSound('correct');
      }
    } else {
      this.streakCount = 0;
      this.playSound('wrong');
    }

    this.updateUpperStats();
    this.renderQuestion();

    // In Speedrun mode: Auto-advance after 220ms
    if (this.config.mode === 'speedrun') {
      setTimeout(() => {
        if (!this.isSubmitted) {
          if (this.currentIndex + 1 < this.quizQuestions.length) {
            this.currentIndex++;
            this.renderQuestion();
          } else {
            this.finishQuiz(true);
          }
        }
      }, 220);
    }
  }

  triggerFiftyFifty() {
    const q = this.quizQuestions[this.currentIndex];
    if (this.userAnswers[q.id]) return; // Already answered

    if (!this.eliminatedChoices[q.id]) {
      this.eliminatedChoices[q.id] = new Set();
    }

    // Pick 2 incorrect choices to eliminate
    const wrongIndices = [0, 1, 2, 3].filter(idx => idx !== q.answer);
    const shuffled = this.shuffleArray(wrongIndices);
    this.eliminatedChoices[q.id].add(shuffled[0]);
    this.eliminatedChoices[q.id].add(shuffled[1]);

    this.playSound('click');
    this.renderQuestion();
  }

  speakQuestion() {
    if (!('speechSynthesis' in window)) {
      alert("บราวเซอร์ของคุณไม่รองรับระบบอ่านออกเสียง (Speech Synthesis)");
      return;
    }

    window.speechSynthesis.cancel();
    const q = this.quizQuestions[this.currentIndex];
    const letters = ['ก', 'ข', 'ค', 'ง'];
    let textToSpeak = `ข้อที่ ${this.currentIndex + 1}. ${q.question}. `;
    q.choices.forEach((c, idx) => {
      textToSpeak += `ตัวเลือก ${letters[idx]}. ${c}. `;
    });

    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.lang = 'th-TH';
    utter.rate = 1.0;
    window.speechSynthesis.speak(utter);
  }

  navigate(direction) {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // Block advancing forward if the user has NOT selected an answer yet
    if (direction > 0) {
      const currentQ = this.quizQuestions[this.currentIndex];
      if (!this.userAnswers[currentQ.id]) {
        this.showAnswerRequiredTip();
        return;
      }
    }

    const nextIdx = this.currentIndex + direction;
    if (nextIdx >= 0 && nextIdx < this.quizQuestions.length) {
      this.currentIndex = nextIdx;
      this.renderQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  showAnswerRequiredTip() {
    this.playSound('wrong');
    if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
    if (this.navHintBox) {
      this.navHintBox.style.display = 'block';
      this.navHintBox.textContent = '⚠️ กรุณาคลิกเลือกคำตอบก่อนไปข้อถัดไปน้า';
    }
    // Subtle shake on choices container to prompt user
    if (this.choicesContainer) {
      this.choicesContainer.style.animation = 'none';
      setTimeout(() => {
        this.choicesContainer.style.animation = 'shakeWrong 0.4s ease';
      }, 10);
    }
  }

  toggleBookmark() {
    const q = this.quizQuestions[this.currentIndex];
    if (this.bookmarkedIds.has(q.id)) {
      this.bookmarkedIds.delete(q.id);
    } else {
      this.bookmarkedIds.add(q.id);
    }
    localStorage.setItem('rywreviewer_bookmarks', JSON.stringify([...this.bookmarkedIds]));
    this.playSound('click');
    this.renderQuestion();
  }

  updateUpperStats() {
    const total = this.quizQuestions.length;
    const answeredCount = Object.keys(this.userAnswers).length;

    // Mode-specific upper stats
    if (this.config.mode === 'practice') {
      this.statCorrectContainer.style.display = 'inline-flex';
      this.statWrongContainer.style.display = 'inline-flex';
      this.statExamProgressContainer.style.display = 'none';

      let correct = 0;
      let wrong = 0;
      Object.values(this.userAnswers).forEach(ans => {
        if (ans.isCorrect) correct++;
        else wrong++;
      });

      this.statCorrectEl.textContent = correct;
      this.statWrongEl.textContent = wrong;

      // Streak Pill
      if (this.streakCount >= 2) {
        this.streakPill.style.display = 'inline-flex';
        this.streakCountEl.textContent = this.streakCount;
      } else {
        this.streakPill.style.display = 'none';
      }
    } else {
      // Exam Mode
      this.statCorrectContainer.style.display = 'none';
      this.statWrongContainer.style.display = 'none';
      this.streakPill.style.display = 'none';
      this.statExamProgressContainer.style.display = 'inline-flex';

      this.statExamAnswered.textContent = answeredCount;
      this.statExamRemaining.textContent = total - answeredCount;
    }

    this.statProgressTextEl.textContent = `${this.currentIndex + 1}/${total}`;
    const progressPct = total > 0 ? ((this.currentIndex + 1) / total) * 100 : 0;
    this.progressBarFill.style.width = `${progressPct}%`;
  }

  updateTimerDisplay() {
    if (this.config.mode === 'exam' && this.examTimeLimitSeconds > 0) {
      const remaining = Math.max(0, this.examTimeLimitSeconds - this.elapsedSeconds);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      this.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (remaining <= 0 && !this.isSubmitted) {
        alert("⏱ หมดเวลาทำข้อสอบแล้ว! ระบบจะทำการส่งข้อสอบและสรุปผลคะแนนให้โดยอัตโนมัติ");
        this.finishQuiz(true);
      }
    } else {
      const mins = Math.floor(this.elapsedSeconds / 60);
      const secs = this.elapsedSeconds % 60;
      this.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  openPalette() {
    this.paletteGrid.innerHTML = '';
    this.quizQuestions.forEach((q, idx) => {
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.textContent = idx + 1;

      if (idx === this.currentIndex) {
        item.classList.add('current');
      }

      if (this.bookmarkedIds.has(q.id)) {
        item.classList.add('bookmarked');
      }

      const ans = this.userAnswers[q.id];
      if (ans !== undefined) {
        if (this.config.mode === 'practice') {
          item.classList.add(ans.isCorrect ? 'answered-correct' : 'answered-wrong');
        } else {
          item.classList.add('answered');
        }
      }

      item.addEventListener('click', () => {
        this.currentIndex = idx;
        this.closePalette();
        this.renderQuestion();
      });

      this.paletteGrid.appendChild(item);
    });

    this.paletteModal.classList.add('active');
  }

  closePalette() {
    this.paletteModal.classList.remove('active');
  }

  finishQuiz(force = false) {
    const answeredCount = Object.keys(this.userAnswers).length;
    const total = this.quizQuestions.length;

    if (!force && answeredCount < total) {
      const remain = total - answeredCount;
      const confirmSubmit = confirm(`⚠️ คุณยังทำข้อสอบไม่ครบ (ยังเหลืออีก ${remain} ข้อ)\nคุณแน่ใจหรือไม่ว่าต้องการส่งข้อสอบและดูผลคะแนนตอนนี้?`);
      if (!confirmSubmit) return;
    }

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.speedrunInterval) {
      clearInterval(this.speedrunInterval);
      this.speedrunInterval = null;
    }
    if (this.speedrunTimerContainer) this.speedrunTimerContainer.style.display = 'none';
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.isSubmitted = true;
    this.showResultScreen();
  }

  showResultScreen() {
    this.screenQuiz.style.display = 'none';
    this.upperStatsBar.style.display = 'none';
    this.screenResult.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let correct = 0;
    let wrong = 0;
    const total = this.quizQuestions.length;

    this.quizQuestions.forEach(q => {
      const ans = this.userAnswers[q.id];
      if (ans && ans.isCorrect) {
        correct++;
      } else {
        wrong++;
      }
    });

    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Display basic stats
    this.resultScore.textContent = correct;
    this.resultTotal.textContent = total;
    this.resultPercentage.textContent = `${percentage}%`;
    this.metricCorrect.textContent = correct;
    this.metricWrong.textContent = wrong;
    this.metricAccuracy.textContent = `${percentage}%`;

    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = this.elapsedSeconds % 60;
    this.metricTime.textContent = `${mins}m ${secs}s`;

    // Grade and celebration
    let gradeBadgeText = '';
    let gradeBadgeStyle = '';
    let feedback = '';

    const isHigh = percentage >= 75;

    if (percentage >= 90) {
      gradeBadgeText = '🏆 อัจฉริยะธุรกิจ (Master Guru)';
      gradeBadgeStyle = 'background: #fef3c7; color: #b45309; border: 1px solid #f59e0b;';
      feedback = 'ยอดเยี่ยมไร้ที่ติ! คุณเข้าใจหลักการประกอบธุรกิจครบถ้วนทุกมิติ พร้อมลงสนามสอบจริงและทำเกรด 4 ได้แน่นอน!';
      this.launchConfetti();
      this.playSound('fanfare');
    } else if (percentage >= 75) {
      gradeBadgeText = '🥇 พร้อมสอบระดับดีมาก (Advanced)';
      gradeBadgeStyle = 'background: #dcfce7; color: #15803d; border: 1px solid #10b981;';
      feedback = 'ทำได้ดีมาก! ความรู้ความเข้าใจแน่นหนา แนะนำให้กดทำซ้ำเฉพาะข้อที่ผิดอีกนิดเพื่อความสมบูรณ์แบบ';
      this.launchConfetti();
      this.playSound('fanfare');
    } else if (percentage >= 60) {
      gradeBadgeText = '🥈 ผ่านเกณฑ์ดี (Competent)';
      gradeBadgeStyle = 'background: #e0f2fe; color: #0369a1; border: 1px solid #38bdf8;';
      feedback = 'คะแนนผ่านเกณฑ์เรียบร้อย! ลองกดดูคำอธิบายของข้อที่พลาดเพื่อเสริมความมั่นใจให้เต็ม 100%';
      this.playSound('correct');
    } else {
      gradeBadgeText = '📚 ควรทบทวนเพิ่มเติม (Needs Review)';
      gradeBadgeStyle = 'background: #fee2e2; color: #b91c1c; border: 1px solid #ef4444;';
      feedback = 'อย่ายอมแพ้! แนะนำให้เปิดอ่านแถบ "สรุปหัวใจสำคัญ" แล้วกดปุ่ม "ทำซ้ำเฉพาะข้อที่ผิด" เพื่อทบทวนเฉพาะจุดที่พลาด';
      this.playSound('wrong');
    }

    this.resultGradeBadge.textContent = gradeBadgeText;
    this.resultGradeBadge.style = gradeBadgeStyle;
    this.resultFeedback.textContent = feedback;

    // Animate circular progress
    const circleOffset = 440 - (440 * percentage) / 100;
    setTimeout(() => {
      this.scoreCircleProgress.style.strokeDashoffset = circleOffset;
      if (percentage >= 75) {
        this.scoreCircleProgress.style.stroke = 'var(--success)';
      } else if (percentage >= 60) {
        this.scoreCircleProgress.style.stroke = 'var(--primary)';
      } else {
        this.scoreCircleProgress.style.stroke = 'var(--danger)';
      }
    }, 200);

    // Show or hide "Retry Wrong Only" button
    if (wrong > 0) {
      this.btnRetryWrong.style.display = 'flex';
      this.btnRetryWrong.innerHTML = `🔁 ทำซ้ำเฉพาะข้อที่ผิด (${wrong} ข้อ)`;
    } else {
      this.btnRetryWrong.style.display = 'none';
    }

    this.renderReviewList('all');

    // EXP & Speedrun rewards
    if (this.config.mode === 'speedrun') {
      const bestSpeed = parseInt(localStorage.getItem('rywreviewer_speedrun_best') || '0', 10);
      if (correct > bestSpeed) {
        localStorage.setItem('rywreviewer_speedrun_best', correct.toString());
        feedback = `⚡ นิวไฮสปีดรันใหม่! คุณตอบถูก ${correct} ข้อใน 60 วินาที ชนะสถิติเดิม (${bestSpeed} ข้อ) สมาธิดีเลิศ!`;
      } else {
        feedback = `⚡ สปีดรัน 60 วิ ทำได้ ${correct} ข้อ! (สถิติสูงสุดของคุณคือ ${bestSpeed} ข้อ)`;
      }
      this.gainExp(correct * 15 + 30, 'Speedrun 60s');
    } else {
      this.gainExp(50 + correct * 5, 'สอบเสร็จสิ้น!');
    }
    this.updateWeakSpotUI();
    this.updateSubjectMasteryUI();

    // ================= POPUP CUTE MODAL =================
    setTimeout(() => {
      this.showCuteResultModal(correct, total, percentage, isHigh, wrong);
    }, 450);
  }

  showCuteResultModal(correct, total, percentage, isHigh, wrong) {
    if (!this.cuteResultModal) return;

    const studentName = this.nickname || 'ผู้สอบ';
    if (isHigh) {
      this.cuteResultCard.className = 'cute-modal-card high-score';
      this.cuteMascotBadge.innerHTML = '🐱✨';
      this.cuteModalTitle.innerHTML = `งุ้ยยย เก่งมากคุณ ${studentName}! 🎉✨`;
      this.cuteModalScorePill.className = 'cute-modal-score-pill high';
      this.cuteModalScoreText.innerHTML = `ได้ ${correct} / ${total} ข้อ (${percentage}%)`;
      this.cuteModalDesc.innerHTML = 'คุณพร้อมลงสนามสอบจริงแล้ว เจ้าก้อนภูมิใจในตัวคุณมาก ปรบมือให้รัว ๆ เลยยย 👏💖';
    } else {
      this.cuteResultCard.className = 'cute-modal-card low-score';
      this.cuteMascotBadge.innerHTML = '🥺💖';
      this.cuteModalTitle.innerHTML = `ไม่เป็นไรนะคุณ ${studentName} สู้ๆ อีกนิดเดียว! 🐾`;
      this.cuteModalScorePill.className = 'cute-modal-score-pill low';
      this.cuteModalScoreText.innerHTML = `ได้ ${correct} / ${total} ข้อ (${percentage}%)`;
      this.cuteModalDesc.innerHTML = 'อย่าเพิ่งท้อนะ! น้อนเชื่อว่าถ้าลองกดปุ่ม <strong>"ทำซ้ำเฉพาะข้อที่ผิด"</strong> เพื่อทวนจุดที่พลาด รอบหน้ารับรองได้คะแนนเต็มแน่นอน! ✨';
    }

    if (wrong > 0) {
      this.btnCuteRetryWrong.style.display = 'flex';
      this.btnCuteRetryWrong.innerHTML = `🔁 ทำซ้ำเฉพาะข้อที่ผิด (${wrong} ข้อ)`;
    } else {
      this.btnCuteRetryWrong.style.display = 'none';
    }

    this.cuteResultModal.classList.add('active');
  }

  renderReviewList(filter = 'all') {
    this.reviewListContainer.innerHTML = '';
    const letters = ['ก', 'ข', 'ค', 'ง'];

    let items = this.quizQuestions.filter(q => {
      const ans = this.userAnswers[q.id];
      const isCorrect = ans && ans.isCorrect;
      if (filter === 'wrong') return !isCorrect;
      if (filter === 'correct') return isCorrect;
      if (filter === 'bookmarked') return this.bookmarkedIds.has(q.id);
      return true;
    });

    if (items.length === 0) {
      this.reviewListContainer.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">ไม่มีข้อสอบในหมวดหมู่นี้</div>`;
      return;
    }

    items.forEach((q) => {
      const ans = this.userAnswers[q.id];
      const isCorrect = ans && ans.isCorrect;
      const userSelected = ans !== undefined ? ans.selected : -1;

      const card = document.createElement('div');
      card.className = `review-item ${isCorrect ? 'is-correct' : 'is-wrong'}`;

      let statusBadge = isCorrect 
        ? `<span class="badge" style="background:#dcfce7; color:#15803d;">✓ ถูกต้อง</span>`
        : `<span class="badge" style="background:#fee2e2; color:#b91c1c;">✗ ไม่ถูกต้อง</span>`;

      let choicesHtml = q.choices.map((c, cIdx) => {
        let extraStyle = '';
        let icon = '';
        if (cIdx === q.answer) {
          extraStyle = 'color:#059669; font-weight:700;';
          icon = ' ✓ (คำตอบที่ถูกต้อง)';
        } else if (cIdx === userSelected) {
          extraStyle = 'color:#dc2626; text-decoration:line-through; font-weight:600;';
          icon = ' ✗ (คุณเลือก)';
        }
        return `<div style="margin: 0.3rem 0; font-size: 0.95rem; ${extraStyle}">
          <strong>${letters[cIdx]}.</strong> ${c}${icon}
        </div>`;
      }).join('');

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <span style="font-size:0.85rem; font-weight:700; color:var(--text-muted);">${q.category}</span>
          ${statusBadge}
        </div>
        <div style="font-weight:700; margin-bottom:0.75rem; font-size:1.05rem; line-height:1.5;">ข้อที่ ${q.id}. ${q.question}</div>
        <div style="margin-left: 0.5rem; margin-bottom: 0.75rem;">
          ${choicesHtml}
        </div>
        <div class="explanation-box" style="margin-top:0.6rem;">
          <div class="explanation-title">💡 สาระสำคัญและคำอธิบายเฉลยภาษาไทย:</div>
          <div class="explanation-text">${q.explanation || 'ไม่มีคำอธิบายเพิ่มเติม'}</div>
        </div>
      `;

      this.reviewListContainer.appendChild(card);
    });
  }

  restartQuiz(onlyWrong = false) {
    if (onlyWrong) {
      const wrongQuestions = this.quizQuestions.filter(q => {
        const ans = this.userAnswers[q.id];
        return !ans || !ans.isCorrect;
      });

      if (wrongQuestions.length === 0) {
        alert("คุณทำถูกต้องครบทุกข้อแล้ว! 🎉");
        return;
      }

      this.startQuiz(wrongQuestions);
    } else {
      this.startQuiz();
    }
  }

  shareScore() {
    let correct = 0;
    this.quizQuestions.forEach(q => {
      const ans = this.userAnswers[q.id];
      if (ans && ans.isCorrect) correct++;
    });
    const total = this.quizQuestions.length;
    const pct = Math.round((correct / total) * 100);

    const shareText = `📚 ผลการทำแบบทดสอบทบทวน: การประกอบธุรกิจ (ม.5)\n` +
      `🎯 ได้คะแนน: ${correct}/${total} (${pct}%)\n` +
      `⏱️ ใช้เวลา: ${this.metricTime.textContent}\n` +
      `💡 มาฝึกทบทวนและทำซ้ำข้อที่ผิดได้ที่ RywReviewer!`;

    navigator.clipboard.writeText(shareText).then(() => {
      alert("📋 คัดลอกผลคะแนนเรียบร้อยแล้ว! สามารถนำไปแชร์ใน LINE หรือส่งให้คุณครูได้เลยครับ");
    }).catch(() => {
      alert(shareText);
    });
  }

  showSetupScreen() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (this.cuteHomeModal) this.cuteHomeModal.classList.remove('active');
    if (this.cuteExitModal) this.cuteExitModal.classList.remove('active');
    if (this.cuteResultModal) this.cuteResultModal.classList.remove('active');
    if (this.tutorialModal) this.tutorialModal.classList.remove('active');
    this.screenResult.style.display = 'none';
    this.screenQuiz.style.display = 'none';
    this.upperStatsBar.style.display = 'none';
    this.screenSetup.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- HOME NAVIGATION ---
  goHome() {
    this.switchTab('quiz');
    this.showSetupScreen();
    this.playSound('click');
  }

  handleHomeClick() {
    this.playSound('click');
    // If user is actively inside the quiz questions (screenQuiz is visible)
    if (this.screenQuiz && this.screenQuiz.style.display === 'block') {
      if (this.cuteHomeModal) {
        this.cuteHomeModal.classList.add('active');
      } else {
        this.goHome();
      }
    } else {
      // In results, review mode, flashcards, cheatsheet, search, or already in setup:
      this.goHome();
    }
  }

  // --- TUTORIAL ENGINE ---
  openTutorial(step = 1) {
    this.playSound('click');
    this.currentTutorialStep = step;
    if (this.cuteHomeModal) this.cuteHomeModal.classList.remove('active');
    if (this.tutorialModal) {
      this.tutorialModal.classList.add('active');
      this.setTutorialStep(step);
    }
  }

  closeTutorial() {
    this.playSound('click');
    if (this.tutorialModal) {
      this.tutorialModal.classList.remove('active');
    }
  }

  setTutorialStep(step) {
    if (step < 1) step = 1;
    if (step > 8) step = 8;
    this.currentTutorialStep = step;

    document.querySelectorAll('.tutorial-tab-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.step, 10) === step);
    });

    document.querySelectorAll('.tutorial-step-pane').forEach((pane, idx) => {
      pane.classList.toggle('active', idx + 1 === step);
    });

    if (this.btnTutorialPrevStep) {
      this.btnTutorialPrevStep.style.visibility = step === 1 ? 'hidden' : 'visible';
    }
    if (this.btnTutorialNextStep) {
      this.btnTutorialNextStep.textContent = step === 8 ? '✓ เข้าใจแล้ว' : 'ถัดไป →';
    }
    this.playSound('click');
  }

  // --- LEARN TAB ENGINE ---
  filterLearnChapter(ch) {
    const chCards = document.querySelectorAll('.learn-chapter-card');
    const tipBox = document.querySelector('.learn-tip-box');
    chCards.forEach(card => {
      if (ch === 'all') {
        card.style.display = 'block';
        if (tipBox) tipBox.style.display = 'block';
      } else if (ch === 'tips') {
        card.style.display = 'none';
        if (tipBox) tipBox.style.display = 'block';
      } else {
        card.style.display = card.dataset.ch === ch ? 'block' : 'none';
        if (tipBox) tipBox.style.display = (ch === 'ch1') ? 'block' : 'none';
      }
    });
  }

  filterLearnSearch(term) {
    const cards = document.querySelectorAll('.learn-chapter-card, .learn-tip-box');
    if (!term) {
      cards.forEach(c => c.style.display = 'block');
      return;
    }
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(term) ? 'block' : 'none';
    });
  }

  // --- FLASHCARD ENGINE ---
  renderFlashcard() {
    if (this.allQuestions.length === 0) return;
    const q = this.allQuestions[this.flashcardIndex];
    this.flashcardCard.classList.remove('flipped');

    this.flashcardCategory.textContent = q.category;
    this.flashcardDifficulty.textContent = q.difficulty_label;
    this.flashcardQuestion.textContent = q.question;
    this.flashcardAnswer.textContent = `${q.answer_letter}. ${q.choices[q.answer]}`;
    this.flashcardExplanation.textContent = q.explanation;
    this.flashcardCounter.textContent = `การ์ดที่ ${this.flashcardIndex + 1} จาก ${this.allQuestions.length}`;

    if (this.flashcardMastered.has(q.id)) {
      this.flashcardMasteredBadge.style.display = 'inline-flex';
      this.btnFlashMaster.innerHTML = `✓ จำได้แล้ว (คลิกเพื่อยกเลิก)`;
      this.btnFlashMaster.style.background = '#dcfce7';
      this.btnFlashMaster.style.color = '#15803d';
    } else {
      this.flashcardMasteredBadge.style.display = 'none';
      this.btnFlashMaster.innerHTML = `📌 บันทึกว่าจำได้แล้ว`;
      this.btnFlashMaster.style.background = 'transparent';
      this.btnFlashMaster.style.color = 'var(--text-main)';
    }
  }

  navigateFlashcard(direction) {
    const next = this.flashcardIndex + direction;
    if (next >= 0 && next < this.allQuestions.length) {
      this.flashcardIndex = next;
      this.renderFlashcard();
      this.playSound('click');
    }
  }

  toggleFlashcardMastered() {
    const q = this.allQuestions[this.flashcardIndex];
    if (this.flashcardMastered.has(q.id)) {
      this.flashcardMastered.delete(q.id);
    } else {
      this.flashcardMastered.add(q.id);
      this.playSound('correct');
    }
    this.renderFlashcard();
  }

  shuffleFlashcards() {
    this.flashcardIndex = Math.floor(Math.random() * this.allQuestions.length);
    this.renderFlashcard();
    this.playSound('click');
  }

  // --- CHEAT SHEET / LEARN TAB ENGINE ---
  initCheatSheet() {
    // Upgraded to comprehensive Tab Learn with complete 2 chapters from official review document
  }

  // --- SEARCH BANK ENGINE ---
  initSearchBank() {
    this.filterSearchBank();
  }

  filterSearchBank() {
    const query = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const diff = document.getElementById('search-difficulty-filter')?.value || 'all';
    const container = document.getElementById('search-results-list');
    if (!container) return;

    const filtered = this.allQuestions.filter(q => {
      const matchDiff = diff === 'all' || q.difficulty === diff;
      const matchQuery = !query || 
        q.question.toLowerCase().includes(query) ||
        q.explanation.toLowerCase().includes(query) ||
        q.choices.some(c => c.toLowerCase().includes(query));
      return matchDiff && matchQuery;
    });

    document.getElementById('search-result-count').textContent = `พบ ${filtered.length} ข้อ`;

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 2.5rem; color:var(--text-muted);">ไม่พบข้อสอบที่ตรงกับคำค้นหา</div>`;
      return;
    }

    container.innerHTML = filtered.map(q => `
      <div class="review-item" style="border-left: 4px solid var(--primary); margin-bottom: 0.85rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">${q.category}</span>
          <span class="badge badge-${q.difficulty}">${q.difficulty_label}</span>
        </div>
        <div style="font-weight:700; font-size:1rem; margin-bottom:0.5rem;">ข้อที่ ${q.id}. ${q.question}</div>
        <div style="background:rgba(16,185,129,0.1); color:#059669; padding:0.5rem 0.75rem; border-radius:8px; font-weight:700; font-size:0.95rem; margin-bottom:0.4rem;">
          ✓ เฉลย: ${q.answer_letter}. ${q.choices[q.answer]}
        </div>
        <div style="font-size:0.9rem; color:var(--text-muted); line-height:1.5;">
          <strong>คำอธิบายภาษาไทย:</strong> ${q.explanation}
        </div>
      </div>
    `).join('');
  }

  // --- KEYBOARD CONTROLS (Multi-layout safe) ---
  handleKeyboard(e) {
    if (this.activeTab !== 'quiz' || this.screenQuiz.style.display !== 'block') return;

    // Esc to exit or close active modals
    if (e.key === 'Escape') {
      if (this.cuteHomeModal && this.cuteHomeModal.classList.contains('active')) {
        this.cuteHomeModal.classList.remove('active');
        return;
      }
      if (this.tutorialModal && this.tutorialModal.classList.contains('active')) {
        this.tutorialModal.classList.remove('active');
        return;
      }
      if (this.cuteExitModal.classList.contains('active')) {
        this.cuteExitModal.classList.remove('active');
      } else {
        this.cuteExitModal.classList.add('active');
      }
      return;
    }

    const codeToChoice = {
      'Digit1': 0, 'Numpad1': 0, 'KeyA': 0,
      'Digit2': 0, 'Numpad2': 1, 'KeyB': 1,
      'Digit3': 0, 'Numpad3': 2, 'KeyC': 2,
      'Digit4': 0, 'Numpad4': 3, 'KeyD': 3
    };

    if (codeToChoice[e.code] !== undefined) {
      const idx = codeToChoice[e.code];
      const q = this.quizQuestions[this.currentIndex];
      if (q && idx < q.choices.length) {
        this.handleAnswerSelect(q, idx);
      }
    }

    if (e.code === 'ArrowRight' || e.code === 'PageDown' || e.code === 'Enter') {
      const currentQ = this.quizQuestions[this.currentIndex];
      if (!this.userAnswers[currentQ.id]) {
        this.showAnswerRequiredTip();
        return;
      }
      if (this.currentIndex < this.quizQuestions.length - 1) {
        this.navigate(1);
      }
    } else if (e.code === 'ArrowLeft' || e.code === 'PageUp') {
      if (this.currentIndex > 0) {
        this.navigate(-1);
      }
    }
  }

  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  loadTheme() {
    const saved = localStorage.getItem('rywreviewer_theme_v3') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeIcon(saved);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('rywreviewer_theme_v3', next);
    this.updateThemeIcon(next);
  }

  updateThemeIcon(theme) {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // ==========================================================================
  // MULTI-SUBJECT & LESSON CONTROLLER METHODS
  // ==========================================================================
  initSubjectSystem() {
    // Subject Pills click (Top Bar)
    document.querySelectorAll('.subject-pill-btn[data-subject]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchSubject(btn.dataset.subject);
        this.playSound('click');
      });
    });

    // Subject Cards click (Setup Screen)
    document.querySelectorAll('.subject-card[data-subject]').forEach(card => {
      card.addEventListener('click', () => {
        this.switchSubject(card.dataset.subject);
        this.playSound('click');
      });
    });

    // Expand Subject Modal Handlers
    const btnAddSub = document.getElementById('btn-add-subject');
    const modalExpand = document.getElementById('expand-subject-modal');
    const btnCloseExpand = document.getElementById('btn-close-expand-modal');
    const btnCancelExpand = document.getElementById('btn-cancel-expand');
    const btnSaveExpand = document.getElementById('btn-save-expand');

    if (btnAddSub && modalExpand) {
      btnAddSub.addEventListener('click', () => {
        modalExpand.style.display = 'flex';
      });
    }
    if (btnCloseExpand && modalExpand) {
      btnCloseExpand.addEventListener('click', () => modalExpand.style.display = 'none');
    }
    if (btnCancelExpand && modalExpand) {
      btnCancelExpand.addEventListener('click', () => modalExpand.style.display = 'none');
    }
    if (btnSaveExpand) {
      btnSaveExpand.addEventListener('click', () => {
        const type = document.getElementById('expand-action-type')?.value;
        const name = (document.getElementById('expand-name-input')?.value || '').trim();
        if (!name) {
          alert('กรุณากรอกชื่อวิชา หรือชื่อบทเรียนใหม่');
          return;
        }

        if (type === 'subject') {
          const subKey = 'custom_' + Date.now();
          this.subjectsData[subKey] = {
            id: subKey,
            name: name,
            shortName: name,
            icon: '📘',
            color: '#3b82f6',
            badgeBg: 'rgba(59, 130, 246, 0.12)',
            desc: `คลังวิชา ${name} (พร้อมขยายบทเรียนและเพิ่มข้อสอบ)`,
            totalQuestions: 0,
            lessons: [{ id: 'all', name: 'ทุกบทเรียน' }, { id: subKey + '_l1', name: 'บทเรียนที่ 1' }],
            questions: []
          };
          try {
            const customSub = JSON.parse(localStorage.getItem('rywreviewer_custom_subjects') || '{}');
            customSub[subKey] = this.subjectsData[subKey];
            localStorage.setItem('rywreviewer_custom_subjects', JSON.stringify(customSub));
          } catch(e) {}

          const pillContainer = document.getElementById('subject-pills-list');
          if (pillContainer && btnAddSub) {
            const newBtn = document.createElement('button');
            newBtn.className = 'subject-pill-btn';
            newBtn.dataset.subject = subKey;
            newBtn.type = 'button';
            newBtn.innerHTML = `<span class="subject-pill-icon">📘</span> <span class="subject-pill-name">${name}</span> <span class="subject-pill-badge">0 ข้อ</span>`;
            newBtn.addEventListener('click', () => this.switchSubject(subKey));
            pillContainer.insertBefore(newBtn, btnAddSub);
          }
          alert(`สร้างวิชา "${name}" เรียบร้อยแล้ว! ส่งไฟล์หรือคำถามมาให้ระบบช่วยเติมข้อสอบได้เลยครับ`);
          this.switchSubject(subKey);
        } else {
          const lessonId = 'lesson_' + Date.now();
          const curr = this.subjectsData[this.currentSubject];
          if (curr) {
            curr.lessons.push({ id: lessonId, name: name });
            this.renderLessonPills();
            alert(`เพิ่มบทเรียน "${name}" ในวิชา "${curr.name}" เรียบร้อยแล้ว!`);
          }
        }
        if (modalExpand) modalExpand.style.display = 'none';
        const input = document.getElementById('expand-name-input');
        if (input) input.value = '';
      });
    }

    // Initial render
    this.renderSubjectUI();
  }

  renderSubjectUI() {
    this.switchSubject(this.currentSubject);
  }

  switchSubject(subjectId) {
    if (!this.subjectsData[subjectId]) return;
    this.currentSubject = subjectId;
    this.currentLesson = 'all';
    this.allQuestions = this.subjectsData[subjectId].questions || [];
    localStorage.setItem('rywreviewer_active_subject', subjectId);

    // Update active subject pill in UI
    document.querySelectorAll('.subject-pill-btn[data-subject]').forEach(btn => {
      if (btn.dataset.subject === subjectId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active subject cards in Setup screen
    document.querySelectorAll('.subject-card[data-subject]').forEach(card => {
      card.classList.toggle('active', card.dataset.subject === subjectId);
    });

    // Update document attribute for CSS accents
    document.documentElement.setAttribute('data-subject-theme', subjectId);

    // Update Header sub-title
    const sub = this.subjectsData[subjectId];
    const subTitle = document.querySelector('.logo-subtitle');
    if (subTitle) {
      subTitle.textContent = `${sub.name} (${this.allQuestions.length} ข้อ)`;
    }

    // Update Study Banner on setup screen
    const bannerTitle = document.querySelector('.study-banner-title');
    const bannerDesc = document.querySelector('.study-banner-desc');
    if (bannerTitle && bannerDesc) {
      if (subjectId === 'history') {
        bannerTitle.textContent = 'ยังไม่มั่นใจ? อ่านสรุปประวัติศาสตร์สากล ม.5 (เวลา ศักราช ยุคสมัย อารยธรรมจีน)';
        bannerDesc.textContent = 'สูตรเทียบ 6 ศักราช (พ.ศ. ค.ศ. ฮ.ศ. ม.ศ. จ.ศ. ร.ศ.), แหล่งโบราณคดี และสรุป 11 ราชวงศ์จีน อ่านจบเข้าใจใน 5 นาที';
      } else {
        bannerTitle.textContent = 'ยังไม่มั่นใจ? อ่านสรุปบทเรียนเข้มข้นก่อนเริ่มสอบ (2 บทหลัก)';
        bannerDesc.textContent = 'สรุปองค์กรธุรกิจ และ วงจรชีวิตธุรกิจ พร้อมตารางเปรียบเทียบและจุดเน้นข้อสอบ อ่านจบเข้าใจใน 5 นาที';
      }
    }

    // Render Lesson Pills
    this.renderLessonPills();

    // Update Learn Tab
    this.updateLearnTabContent();

    // Update Available Counts
    this.updateAvailableCounts();

    // Reset Flashcards to index 0
    this.flashcardIndex = 0;
    this.renderFlashcard();

    // Re-filter Search Bank
    this.filterSearchBank();

    // Update Weak Spot and Subject Mastery UI
    this.updateWeakSpotUI();
    this.updateSubjectMasteryUI();
  }

  renderLessonPills() {
    const container = document.getElementById('lesson-pills-container');
    if (!container) return;
    const sub = this.subjectsData[this.currentSubject];
    if (!sub || !sub.lessons) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = sub.lessons.map(l => `
      <button class="lesson-pill-btn ${this.currentLesson === l.id ? 'active' : ''}" data-lesson="${l.id}" type="button">
        ${l.name}
      </button>
    `).join('');

    container.querySelectorAll('.lesson-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.lesson-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLesson = btn.dataset.lesson;
        this.updateAvailableCounts();
        this.playSound('click');
      });
    });
  }

  updateLearnTabContent() {
    const learnThurakid = document.getElementById('learn-content-thurakid');
    const learnHistory = document.getElementById('learn-content-history');
    const badge = document.querySelector('.learn-header-badge');
    const title = document.querySelector('.learn-header-title');
    const sub = document.querySelector('.learn-header-sub');
    const pillsContainer = document.querySelector('.learn-filter-pills');

    if (this.currentSubject === 'history') {
      if (learnThurakid) learnThurakid.style.display = 'none';
      if (learnHistory) learnHistory.style.display = 'block';
      if (badge) badge.textContent = '📖 เอกสารทบทวนเตรียมสอบ • ประวัติศาสตร์สากล ม.5';
      if (title) title.textContent = 'สรุปเข้มก่อนสอบ: เวลา ยุคสมัย และอารยธรรมจีน';
      if (sub) sub.textContent = 'สูตรเทียบ 6 ศักราชสำคัญ, ยุคก่อนประวัติศาสตร์ vs ประวัติศาสตร์, สรุป 11 ราชวงศ์จีน และแนวข้อสอบจริง 12 ข้อ';
      if (pillsContainer) {
        pillsContainer.innerHTML = `
          <button class="learn-filter-btn active" data-chapter="all">🌟 เนื้อหาทั้งหมด</button>
          <button class="learn-filter-btn" data-chapter="history_era">⏳ ส่วนที่ 1: ศักราช</button>
          <button class="learn-filter-btn" data-chapter="history_period">🏺 ส่วนที่ 2: ยุคสมัย & โบราณคดี</button>
          <button class="learn-filter-btn" data-chapter="history_china_ancient">🐉 ส่วนที่ 3: อารยธรรมจีน</button>
          <button class="learn-filter-btn" data-chapter="history_china_modern">🇨🇳 ส่วนที่ 4: จีนสมัยใหม่</button>
        `;
        pillsContainer.querySelectorAll('.learn-filter-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            pillsContainer.querySelectorAll('.learn-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.filterLearnChapter(btn.dataset.chapter);
            this.playSound('click');
          });
        });
      }
    } else {
      if (learnThurakid) learnThurakid.style.display = 'block';
      if (learnHistory) learnHistory.style.display = 'none';
      if (badge) badge.textContent = '📖 เอกสารทบทวนเตรียมสอบ • การงานอาชีพ 2 (งานธุรกิจ) ม.5';
      if (title) title.textContent = 'สรุปเนื้อหาเข้มข้น: องค์กรธุรกิจ และ วงจรชีวิตธุรกิจ';
      if (sub) sub.textContent = 'รวบรวมประเด็นหลัก คำจำกัดความ จุดเน้นข้อสอบ และตารางเปรียบเทียบครบถ้วนตามบทเรียน อ่านจบเข้าใจได้ใน 5-10 นาที';
      if (pillsContainer) {
        pillsContainer.innerHTML = `
          <button class="learn-filter-btn active" data-chapter="all">🌟 เนื้อหาทั้งหมด</button>
          <button class="learn-filter-btn" data-chapter="ch1">🏛️ บทที่ 1: องค์กรธุรกิจ</button>
          <button class="learn-filter-btn" data-chapter="ch2">📈 บทที่ 2: วงจรชีวิตธุรกิจ</button>
          <button class="learn-filter-btn" data-chapter="tips">⚡ จุดเน้นข้อสอบ (Tips)</button>
        `;
        pillsContainer.querySelectorAll('.learn-filter-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            pillsContainer.querySelectorAll('.learn-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.filterLearnChapter(btn.dataset.chapter);
            this.playSound('click');
          });
        });
      }
    }
  }

  // ==========================================
  // LEVEL & GAMIFICATION SYSTEM
  // ==========================================
  gainExp(amount, label = '') {
    const oldLevel = Math.floor(this.exp / 100) + 1;
    this.exp += amount;
    localStorage.setItem('rywreviewer_exp', this.exp.toString());
    const newLevel = Math.floor(this.exp / 100) + 1;

    // Show floating EXP toast
    try {
      const toast = document.createElement('div');
      toast.className = 'exp-floating-toast';
      toast.innerHTML = `<span>⭐ +${amount} EXP</span> ${label ? `<small style="font-size:0.75rem;opacity:0.9;">(${label})</small>` : ''}`;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      }, 1800);
    } catch (e) {}

    // Level up celebration
    if (newLevel > oldLevel) {
      this.playSound('fanfare');
      this.launchConfetti();
      setTimeout(() => {
        alert(`🎉 ยินดีด้วย! คุณเลเวลอัปเป็น Lv.${newLevel} เรียบร้อยแล้ว!\nสะสมความรู้เตรียมพร้อมเกรด 4 ได้อย่างยอดเยี่ยม`);
      }, 300);
    }

    this.updateLevelUI();
  }

  updateLevelUI() {
    const level = Math.floor(this.exp / 100) + 1;
    const progress = this.exp % 100;
    const levelEl = document.getElementById('player-level-text');
    const fillEl = document.getElementById('player-exp-fill');
    if (levelEl) levelEl.textContent = `⭐ Lv.${level}`;
    if (fillEl) fillEl.style.width = `${progress}%`;
  }

  // ==========================================
  // WEAK SPOT ANALYZER & DRILL
  // ==========================================
  recordQuestionResult(q, isCorrect) {
    try {
      const wrongBank = JSON.parse(localStorage.getItem('rywreviewer_wrong_bank') || '{}');
      const stats = JSON.parse(localStorage.getItem('rywreviewer_stats') || '{}');

      // Update question stats
      if (!stats[q.id]) stats[q.id] = { correct: 0, wrong: 0, subject: q.subject || this.currentSubject };
      if (isCorrect) {
        stats[q.id].correct++;
      } else {
        stats[q.id].wrong++;
      }
      localStorage.setItem('rywreviewer_stats', JSON.stringify(stats));

      // Update wrong bank
      if (!isCorrect) {
        wrongBank[q.id] = {
          id: q.id,
          subject: q.subject || this.currentSubject,
          lesson: q.lesson || 1,
          question: q.question,
          choices: q.choices,
          answer: q.answer,
          explanation: q.explanation,
          category: q.category,
          difficulty: q.difficulty,
          difficulty_label: q.difficulty_label,
          wrongCount: (wrongBank[q.id]?.wrongCount || 0) + 1,
          timestamp: Date.now()
        };
      } else {
        // Mastered this question! Remove from wrong bank
        if (wrongBank[q.id]) {
          delete wrongBank[q.id];
        }
      }
      localStorage.setItem('rywreviewer_wrong_bank', JSON.stringify(wrongBank));
    } catch (e) {
      console.warn("Storage error in recordQuestionResult:", e);
    }

    this.updateWeakSpotUI();
    this.updateSubjectMasteryUI();
  }

  updateWeakSpotUI() {
    const banner = document.getElementById('weak-spot-banner');
    const countEl = document.getElementById('weak-spot-count');
    if (!banner || !countEl) return;

    try {
      const wrongBank = JSON.parse(localStorage.getItem('rywreviewer_wrong_bank') || '{}');
      const curSubj = this.currentSubject;
      const wrongIds = Object.keys(wrongBank).filter(id => {
        const item = wrongBank[id];
        return !item.subject || item.subject === curSubj;
      });

      if (wrongIds.length > 0) {
        banner.style.display = 'flex';
        countEl.textContent = wrongIds.length.toString();
      } else {
        banner.style.display = 'none';
      }
    } catch (e) {
      banner.style.display = 'none';
    }
  }

  startWeakSpotDrill() {
    try {
      const wrongBank = JSON.parse(localStorage.getItem('rywreviewer_wrong_bank') || '{}');
      const curSubj = this.currentSubject;
      let wrongList = Object.values(wrongBank).filter(item => !item.subject || item.subject === curSubj);
      
      if (wrongList.length === 0) {
        wrongList = Object.values(wrongBank);
      }

      if (wrongList.length === 0) {
        alert("🎉 ยอดเยี่ยมมาก! คุณไม่มีข้อที่ตอบผิดสะสมอยู่เลยในขณะนี้ พร้อมสอบ 100%!");
        return;
      }

      const drillQuestions = wrongList.map(item => {
        const found = this.allQuestions.find(q => q.id === item.id);
        if (found) return found;
        return {
          id: item.id,
          question: item.question,
          choices: item.choices || ['ก', 'ข', 'ค', 'ง'],
          answer: item.answer !== undefined ? item.answer : 0,
          answer_letter: ['ก', 'ข', 'ค', 'ง'][item.answer || 0],
          explanation: item.explanation || 'ทบทวนหัวข้อนี้อย่างละเอียดเพื่อความแม่นยำ',
          category: item.category || 'ติวซ่อมจุดอ่อน',
          difficulty: item.difficulty || 'medium',
          difficulty_label: item.difficulty_label || 'ปานกลาง'
        };
      });

      this.config.mode = 'practice';
      this.startQuiz(drillQuestions);
    } catch (e) {
      console.error("Error launching weak spot drill:", e);
    }
  }

  updateSubjectMasteryUI() {
    try {
      const stats = JSON.parse(localStorage.getItem('rywreviewer_stats') || '{}');
      const wrongBank = JSON.parse(localStorage.getItem('rywreviewer_wrong_bank') || '{}');

      ['thurakid', 'history'].forEach(subKey => {
        const subData = this.subjectsData[subKey];
        if (!subData || !subData.questions) return;
        const total = subData.questions.length;
        
        let mastered = 0;
        subData.questions.forEach(q => {
          if (stats[q.id] && stats[q.id].correct > 0 && !wrongBank[q.id]) {
            mastered++;
          }
        });

        const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
        const textEl = document.getElementById(`subject-progress-text-${subKey}`);
        const barEl = document.getElementById(`subject-progress-bar-${subKey}`);
        if (textEl) textEl.textContent = `${pct}% (${mastered}/${total} ข้อ)`;
        if (barEl) barEl.style.width = `${pct}%`;
      });
    } catch (e) {
      console.warn("Error updating subject mastery:", e);
    }
  }

  // ==========================================
  // FLASHCARD TOUCH SWIPE GESTURES
  // ==========================================
  initFlashcardSwipe() {
    const card = this.flashcardCard;
    if (!card) return;

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isSwiping = false;

    card.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      currentX = startX;
      isSwiping = true;
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (!isSwiping || e.touches.length !== 1) return;
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      const diffY = e.touches[0].clientY - startY;

      // Only track distinct horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 15) {
        if (diffX < 0) {
          card.classList.add('swiping-left');
          card.classList.remove('swiping-right');
        } else {
          card.classList.add('swiping-right');
          card.classList.remove('swiping-left');
        }
      }
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      isSwiping = false;
      const diffX = currentX - startX;
      card.classList.remove('swiping-left', 'swiping-right');

      if (diffX < -60) {
        // Swipe Left: Review again -> Advance next
        this.playSound('click');
        this.navigateFlashcard(1);
      } else if (diffX > 60) {
        // Swipe Right: Mastered!
        const q = this.allQuestions[this.flashcardIndex];
        if (q && !this.flashcardMastered.has(q.id)) {
          this.flashcardMastered.add(q.id);
          this.gainExp(5, 'จำการ์ดได้แล้ว');
          this.playSound('correct');
        }
        this.navigateFlashcard(1);
      }
    });
  }


  // ==========================================
  // NICKNAME & PROFILE SYSTEM
  // ==========================================
  openNicknameModal() {
    const modal = document.getElementById('nickname-modal');
    const input = document.getElementById('nickname-input');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
      try { this.playSound('click'); } catch (e) {}
    }
    if (input) {
      input.value = this.nickname && this.nickname !== 'ผู้สอบ' ? this.nickname : '';
      setTimeout(() => input.focus(), 150);
    }
  }

  closeNicknameModal() {
    const modal = document.getElementById('nickname-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
      try { this.playSound('click'); } catch (e) {}
    }
  }

  saveNickname(customName = null) {
    const input = document.getElementById('nickname-input');
    let name = customName !== null ? customName : (input ? input.value : '');
    name = (name || '').trim();
    if (!name) name = 'ผู้สอบ';

    this.nickname = name;
    localStorage.setItem('rywreviewer_nickname', this.nickname);
    this.updateNicknameUI();
    this.closeNicknameModal();
    try { this.playSound('correct'); } catch (e) {}

    // Floating Welcome Toast
    try {
      const toast = document.createElement('div');
      toast.className = 'exp-floating-toast';
      toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      toast.innerHTML = `<span>👋 สวัสดีคุณ ${this.nickname}!</span>`;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      }, 1900);
    } catch (e) {}
  }

  updateNicknameUI() {
    const displayName = this.nickname || 'ผู้สอบ';
    const headerDisplay = document.getElementById('player-nickname-display');
    const heroDisplay = document.getElementById('hero-nickname-display');
    if (headerDisplay) headerDisplay.textContent = displayName;
    if (heroDisplay) heroDisplay.textContent = displayName;
  }

}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ExamApp();
  window.examApp = window.app;
  window.app.updateAvailableCounts();

  // Support direct URL parameters for deep-linking & previews (e.g. ?mode=learn, ?mode=quiz)
  try {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'quiz') {
      window.app.startQuiz();
    } else if (mode === 'quiz_answered') {
      window.app.startQuiz();
      setTimeout(() => {
        const choice = document.querySelector('.choice-btn');
        if (choice) choice.click();
      }, 250);
    } else if (mode === 'learn') {
      window.app.switchTab('learn');
    } else if (mode === 'home_modal') {
      window.app.startQuiz();
      setTimeout(() => {
        window.app.showCuteHomeModal();
      }, 250);
    } else if (mode === 'tutorial') {
      setTimeout(() => {
        window.app.openTutorialModal();
      }, 250);
    }
  } catch (err) {
    console.warn('URL param parse error:', err);
  }
});
