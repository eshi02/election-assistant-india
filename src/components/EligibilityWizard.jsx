import { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'citizenship',
    question: 'Are you an Indian citizen?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'oci', label: "I'm an OCI/PIO card holder" },
    ],
  },
  {
    id: 'age',
    question: 'How old are you (or will you be on January 1 next year)?',
    options: [
      { value: 'under17', label: 'Under 17' },
      { value: '17', label: '17' },
      { value: '18plus', label: '18 or older' },
    ],
  },
  {
    id: 'residence',
    question: 'Do you have proof of residence in India (Aadhaar, utility bill, etc.)?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'registered',
    question: 'Are you already registered as a voter?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
];

function evaluateAnswers(answers) {
  // Hard disqualifiers first
  if (answers.citizenship === 'no') {
    return {
      status: 'ineligible',
      title: 'Not eligible to vote in India',
      message: 'Indian elections are open only to Indian citizens. OCI/PIO card holders cannot vote in Indian elections — but you may be eligible to vote in the country where you hold citizenship.',
      next: [],
    };
  }
  if (answers.citizenship === 'oci') {
    return {
      status: 'ineligible',
      title: 'OCI/PIO holders cannot vote in India',
      message: 'OCI cards do not grant voting rights. To vote in Indian elections, you must hold Indian citizenship.',
      next: [],
    };
  }
  if (answers.age === 'under17') {
    return {
      status: 'wait',
      title: 'You can register at 17',
      message: 'You need to be at least 17 to apply (you become eligible to vote when you turn 18). Bookmark this — your time will come!',
      next: ['Save voters.eci.gov.in for later', 'Learn how the voting process works'],
    };
  }
  if (answers.residence === 'no') {
    return {
      status: 'partial',
      title: 'Get a residence proof first',
      message: 'You need at least one valid proof of ordinary residence (Aadhaar, passport, ration card, electricity/water/gas bill, bank passbook, etc.) to register.',
      next: [
        'Apply for Aadhaar at uidai.gov.in if you don\'t have one',
        'Once you have residence proof, apply via Form 6',
      ],
    };
  }

  // Eligible paths
  if (answers.registered === 'yes') {
    return {
      status: 'eligible',
      title: "You're already a voter — great!",
      message: 'You\'re all set. Before polling day, just verify your details and find your booth.',
      next: [
        'Check your entry at voters.eci.gov.in (Search in Electoral Roll)',
        'Use Form 8 if any details need updating',
        'Find your polling booth via the booth lookup feature here',
      ],
    };
  }

  if (answers.age === '17') {
    return {
      status: 'eligible',
      title: 'You can apply in advance now!',
      message: 'ECI accepts applications from 17-year-olds. You\'ll be added to the rolls automatically when you turn 18.',
      next: [
        'Visit voters.eci.gov.in and submit Form 6',
        'Upload age proof and address proof',
        'Track your application status with the reference number',
      ],
    };
  }

  // Default: 18+, citizen, has residence, not registered
  return {
    status: 'eligible',
    title: "You're eligible — let's get you registered! 🎉",
    message: 'You meet all the criteria. Registration is free and takes about 10 minutes online.',
    next: [
      'Visit voters.eci.gov.in or download the Voter Helpline App',
      'Fill Form 6 (new voter registration)',
      'Upload age proof (10th marksheet/passport/PAN/Aadhaar) and address proof',
      'Track application status — typically processed in 2-4 weeks',
      'Download your e-EPIC once approved',
    ],
  };
}

export default function EligibilityWizard({ onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const handleAnswer = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Short-circuit on hard disqualifiers — no point asking more questions
    if (questionId === 'citizenship' && (value === 'no' || value === 'oci')) {
      setResult(evaluateAnswers(newAnswers));
      return;
    }

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setResult(evaluateAnswers(newAnswers));
    }
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  if (result) {
    const Icon = result.status === 'eligible' ? CheckCircle2
               : result.status === 'ineligible' ? XCircle
               : AlertCircle;
    const color = result.status === 'eligible' ? 'text-green-600'
                : result.status === 'ineligible' ? 'text-red-600'
                : 'text-amber-600';

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <Icon className={color} size={32} />
          <div>
            <h3 className="text-xl font-semibold text-ink">{result.title}</h3>
            <p className="text-gray-600 mt-1">{result.message}</p>
          </div>
        </div>

        {result.next.length > 0 && (
          <div className="bg-orange-50 rounded-xl p-4 mb-4">
            <p className="font-medium text-ink mb-2">Next steps:</p>
            <ul className="space-y-2">
              {result.next.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <ArrowRight size={16} className="text-saffron flex-shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw size={14} /> Start over
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-navy text-white hover:bg-blue-900 rounded-lg transition-colors"
          >
            Back to chat
          </button>
        </div>
      </div>
    );
  }

  const current = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Question {step + 1} of {QUESTIONS.length}</span>
          <button onClick={onClose} className="hover:text-ink">Close</button>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-saffron transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-ink mb-4">{current.question}</h3>

      <div className="space-y-2">
        {current.options.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleAnswer(current.id, opt.value)}
            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-orange-50 hover:border-saffron border border-gray-200 rounded-xl transition-colors"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}