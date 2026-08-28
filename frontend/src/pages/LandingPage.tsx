import { Shield, Vote, FileCheck, ArrowRight, Users, Award, Globe, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: Shield,
    title: 'Sybil-Resistant Identity',
    description: 'Blockchain-verified identities prevent fake accounts and ensure every contribution is tied to a real person.',
  },
  {
    icon: Vote,
    title: 'Transparent Voting',
    description: 'Community-driven validation with on-chain voting ensures fair and transparent contribution verification.',
  },
  {
    icon: FileCheck,
    title: 'Immutable Records',
    description: 'Every contribution is recorded on-chain, creating a permanent and tamper-proof history of civic engagement.',
  },
];

const steps = [
  { number: '01', title: 'Connect Wallet', description: 'Link your MetaMask wallet to establish your unique identity on the platform.' },
  { number: '02', title: 'Browse Campaigns', description: 'Explore civic campaigns and find causes that match your interests and skills.' },
  { number: '03', title: 'Submit Contributions', description: 'Log your hours, upload proof, and get your contributions verified by the community.' },
  { number: '04', title: 'Earn Recognition', description: 'Build your reputation, earn badges, and climb the leaderboard with every verified contribution.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Decentralized Civic Contributions
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 leading-relaxed">
              A transparent, blockchain-powered platform that rewards and recognizes civic participation.
              Connect your wallet, contribute to campaigns, and build your on-chain reputation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate('/login')} className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 text-lg">
                Get Started
                <ArrowRight size={20} />
              </button>
              <button onClick={() => navigate('/campaigns')} className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors text-lg">
                Browse Campaigns
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              CivicChain leverages blockchain technology to create a transparent and trustworthy platform for civic engagement.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="card p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-5">
                  <feature.icon className="text-primary-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting started with CivicChain is easy. Follow these simple steps to begin your civic contribution journey.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="card p-6 text-center">
                  <div className="text-primary-600 font-bold text-3xl mb-3">{step.number}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
                {step.number !== '04' && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-primary-300">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of civic contributors building a transparent and decentralized future for community service.
          </p>
          <button onClick={() => navigate('/login')} className="bg-white text-primary-700 px-10 py-3.5 rounded-lg font-semibold hover:bg-primary-50 transition-colors text-lg inline-flex items-center gap-2">
            Connect Your Wallet
            <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}
