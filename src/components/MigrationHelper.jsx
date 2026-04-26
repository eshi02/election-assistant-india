import { useState } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, RotateCcw, MapPinned, MessageSquare } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'registered',
    question: 'Are you currently registered as a voter in India?',
    options: [
      { value: 'yes', label: 'Yes, I have an EPIC / I\'m on the roll' },
      { value: 'no', label: 'No, I\'ve never registered' },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    id: 'serviceVoter',
    question: 'Are you in the armed forces, central armed police, or posted abroad on government duty?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'currentVsHome',
    question: 'Where are you living right now compared to where you\'re registered?',
    options: [
      { value: 'same', label: 'Same constituency as my registration' },
      { value: 'sameState', label: 'Different city, same state' },
      { value: 'diffState', label: 'Different state' },
      { value: 'outsideIndia', label: 'Outside India' },
    ],
  },
  {
    id: 'duration',
    question: 'How long have you lived at your current address?',
    options: [
      { value: 'short', label: 'Less than 6 months' },
      { value: 'long', label: '6 months or more' },
      { value: 'temporary', label: "I'm here temporarily (studies / short-term work)" },
    ],
  },
  {
    id: 'pollDayLocation',
    question: 'Will you be at your registered home constituency on polling day?',
    options: [
      { value: 'yes', label: 'Yes, definitely' },
      { value: 'no', label: 'Probably not' },
      { value: 'maybe', label: 'Not sure yet' },
    ],
  },
];

function evaluateMigrationPath(answers) {
  if (answers.registered === 'no') {
    return {
      status: 'action',
      title: 'Register first using Form 6',
      message: 'You need to register as a new voter before any of the other options apply. Form 6 is free and takes about 10 minutes online.',
      next: [
        'Visit voters.eci.gov.in or download the Voter Helpline App',
        'Fill Form 6 with age proof and address proof at your CURRENT address (where you ordinarily reside)',
        'Track your application status — typically processed in 2–4 weeks',
        'Download your e-EPIC once approved',
      ],
      prefillChat: 'Walk me through filling Form 6 to register as a new voter.',
    };
  }

  if (answers.registered === 'unsure') {
    return {
      status: 'partial',
      title: 'Check the electoral roll first',
      message: 'Before deciding next steps, confirm whether you\'re already on the rolls. The search is free and takes a minute.',
      next: [
        'Go to voters.eci.gov.in and click "Search in Electoral Roll"',
        'Search by EPIC number, by name + state, or by mobile number',
        'If you find your entry, come back and run this check again with "Yes"',
        'If not found, you\'ll need to register fresh with Form 6',
      ],
      prefillChat: 'How do I check if I\'m already on the electoral roll?',
    };
  }

  if (answers.serviceVoter === 'yes') {
    return {
      status: 'action',
      title: 'You qualify as a service voter — postal ballot path',
      message: 'Service voters (armed forces, paramilitary, government employees posted abroad) have a separate postal-ballot system. You can vote even when posted away from your home constituency.',
      next: [
        'Apply for service voter classification via Form 2 / 2A / 3 (depending on your service)',
        'Use Form 12 (or Form 12A for service voters) to request your postal ballot before each election',
        'Your unit\'s Record Officer / Mission helps process the forms',
        'The ballot is mailed to you, you mark it, and return it sealed before the deadline',
      ],
      prefillChat: 'How does the service voter postal ballot (Form 12 / 12A) work for armed forces and government employees?',
    };
  }

  if (answers.currentVsHome === 'outsideIndia') {
    return {
      status: 'action',
      title: 'Register as an Overseas Voter (NRI)',
      message: 'Indian citizens living abroad can register as overseas voters using Form 6A. You\'ll still need to travel to your home constituency to vote in person — proxy and postal voting are not currently available for general NRIs.',
      next: [
        'Visit voters.eci.gov.in and submit Form 6A',
        'Upload a copy of your passport (the page with your address abroad)',
        'Once registered, plan travel to your home constituency on polling day',
        'Carry your passport as ID at the booth',
      ],
      prefillChat: 'Explain Form 6A and how overseas Indians (NRIs) can vote in Indian elections.',
    };
  }

  if (answers.currentVsHome === 'same') {
    return {
      status: 'eligible',
      title: "You're set — vote at your registered booth",
      message: 'You\'re registered in the same constituency where you currently live, so no transfer is needed. Just confirm your details and find your booth before polling day.',
      next: [
        'Verify your entry at voters.eci.gov.in (Search in Electoral Roll)',
        'Use the Booth Lookup feature here to find your polling station',
        'Carry an approved photo ID on polling day (EPIC, Aadhaar, passport, etc.)',
      ],
      prefillChat: 'What documents and ID should I bring to my polling booth on election day?',
    };
  }

  if (answers.pollDayLocation === 'yes') {
    return {
      status: 'eligible',
      title: 'Travel home to vote — your registration stays as is',
      message: 'Since you\'ll be in your home constituency on polling day, you don\'t need to change anything. Just make sure your name is still on the roll there and you have valid ID.',
      next: [
        'Confirm your name is on the roll at voters.eci.gov.in',
        'Find your polling booth in your home constituency',
        'Plan travel to reach the booth during polling hours (usually 7 AM – 6 PM)',
        'Carry an approved photo ID — EPIC, Aadhaar, passport, driving licence, or any of the 13 ECI-accepted IDs',
      ],
      prefillChat: 'What ID and documents should I carry to vote on polling day?',
    };
  }

  if (answers.duration === 'long') {
    return {
      status: 'action',
      title: 'Transfer your registration with Form 8',
      message: 'You\'ve lived at your current address for 6+ months and won\'t be home on polling day, so transferring your registration to your new address is the cleanest path. Form 8 handles this — including the old "Form 8A" transposition workflow, which has been merged into Form 8 since August 2022.',
      next: [
        'Visit voters.eci.gov.in and choose "Shifting of Residence / Correction of Entries / Replacement of EPIC / Marking as PwD" (Form 8)',
        'Upload proof of your CURRENT address (Aadhaar, electricity bill, rent agreement, etc.)',
        'Submit — processing typically takes 2–4 weeks',
        'Your name will be removed from the old constituency and added to the new one automatically',
        'After approval, find your new polling booth via the Booth Lookup feature',
      ],
      prefillChat: 'How do I transfer my voter registration to a new address using Form 8?',
    };
  }

  return {
    status: 'partial',
    title: 'Limited options — postal ballot isn\'t available for general migrants',
    message: 'For short-term or temporary migrants who can\'t travel home, India does NOT currently offer a postal ballot or proxy vote. Postal voting is restricted to specific categories (service voters, voters above 80, persons with 40%+ disability, essential-services workers, election-duty staff).',
    next: [
      'Best option: plan travel to your home constituency for polling day — even one day is enough',
      'If you\'ll be at your current city for 6+ months, transfer your registration via Form 8 so future elections are easier',
      'If you fall into a special category later (age 80+, disability, essential service), you may apply for a postal ballot via Form 12D',
      'Check with your employer — Section 135B of the RP Act guarantees a paid holiday on polling day',
    ],
    prefillChat: 'What are my voting options if I can\'t travel to my home constituency on polling day?',
  };
}

export default function MigrationHelper({ onClose, onAskChat }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const handleAnswer = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Short-circuit on hard branches — no point asking the rest.
    if (questionId === 'registered' && (value === 'no' || value === 'unsure')) {
      setResult(evaluateMigrationPath(newAnswers));
      return;
    }
    if (questionId === 'serviceVoter' && value === 'yes') {
      setResult(evaluateMigrationPath(newAnswers));
      return;
    }
    if (questionId === 'currentVsHome' && (value === 'same' || value === 'outsideIndia')) {
      setResult(evaluateMigrationPath(newAnswers));
      return;
    }

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setResult(evaluateMigrationPath(newAnswers));
    }
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  if (result) {
    const Icon = result.status === 'eligible' ? CheckCircle2 : AlertCircle;
    const color = result.status === 'eligible' ? 'text-green-600'
                : result.status === 'action' ? 'text-saffron'
                : 'text-amber-600';

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <Icon className={color} size={32} aria-hidden="true" />
          <div>
            <h3 className="text-xl font-semibold text-ink">{result.title}</h3>
            <p className="text-gray-600 mt-1">{result.message}</p>
          </div>
        </div>

        {result.next.length > 0 && (
          <div className="bg-orange-50 rounded-xl p-4 mb-4">
            <p className="font-medium text-ink mb-2">Next steps:</p>
            <ul className="space-y-2">
              {result.next.map((stepText, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <ArrowRight size={16} className="text-saffron flex-shrink-0 mt-0.5" />
                  <span>{stepText}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw size={14} /> Start over
          </button>
          {result.prefillChat && onAskChat && (
            <button
              onClick={() => onAskChat(result.prefillChat)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-saffron text-white hover:bg-orange-500 rounded-lg transition-colors"
            >
              <MessageSquare size={14} /> Ask the assistant
            </button>
          )}
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
      <div className="flex items-center gap-2 mb-4">
        <MapPinned size={20} className="text-saffron" />
        <h2 className="text-lg font-semibold text-ink">I moved cities — how do I vote?</h2>
      </div>

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
