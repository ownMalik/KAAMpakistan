import React, { useState } from 'react';
import { Search, MapPin, Star, ShieldCheck, Phone, MessageSquare, Briefcase, CheckCircle2 } from 'lucide-react';

interface ProviderCardProps {
  name: string;
  category: string;
  rating: number;
  reviewsCount: number;
  city: string;
  distance: string;
  experience: number;
  skills: string[];
  price: string;
  isAvailable: boolean;
  avatarUrl: string;
  onViewProfile: () => void;
  onCall: () => void;
  onChat: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  name,
  category,
  rating,
  reviewsCount,
  city,
  distance,
  experience,
  skills,
  price,
  isAvailable,
  avatarUrl,
  onViewProfile,
  onCall,
  onChat
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
              alt={name} 
              className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-lg text-gray-900">{name}</h3>
                <ShieldCheck className="w-4 h-4 text-primary fill-primary/10" />
              </div>
              <p className="text-sm font-medium text-primary">{category}</p>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{city} • {distance}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-sm text-amber-900">{rating}</span>
              <span className="text-xs text-amber-700">({reviewsCount})</span>
            </div>
            <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
              {isAvailable ? '🟢 Available Today' : '🔴 Busy'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium">
            {experience} yrs exp
          </span>
          {skills.map((skill, idx) => (
            <span key={idx} className="text-xs bg-teal-50 text-teal-800 px-2.5 py-1 rounded-md font-medium">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-400 block">Starting Rate</span>
          <span className="text-base font-bold text-gray-900">{price}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onCall}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            title="Call Provider"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button 
            onClick={onChat}
            className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-primary transition-colors"
            title="Chat in App"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button 
            onClick={onViewProfile}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors shadow-sm"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedCity, setSelectedCity] = useState('Rawalpindi');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Mock initial Pakistani worker profiles for MVP demo
  const mockProviders = [
    {
      id: '1',
      name: 'Muhammad Ahmed',
      category: 'Carpenter',
      rating: 4.9,
      reviewsCount: 127,
      city: 'Rawalpindi',
      distance: '3.2 km away',
      experience: 8,
      skills: ['Furniture', 'Doors', 'Cabinets', 'Wood Repair'],
      price: 'Rs. 1,500 / day',
      isAvailable: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: '2',
      name: 'Tariq Mehmood',
      category: 'Electrician',
      rating: 4.8,
      reviewsCount: 94,
      city: 'Rawalpindi',
      distance: '1.5 km away',
      experience: 10,
      skills: ['Wiring', 'Inverter Repair', 'UPS Setup', 'Circuit Breakers'],
      price: 'Rs. 400 / hour',
      isAvailable: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: '3',
      name: 'Rashid Khan',
      category: 'AC Technician',
      rating: 4.7,
      reviewsCount: 82,
      city: 'Rawalpindi',
      distance: '4.8 km away',
      experience: 6,
      skills: ['AC Gas Refill', 'Installation', 'Inverter Servicing'],
      price: 'Rs. 2,000 / service',
      isAvailable: false,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-md">
              KP
            </div>
            <div>
              <span className="font-extrabold text-lg text-gray-900 tracking-tight">KAAM PAKISTAN</span>
              <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Find the Right Person for the Job</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm font-semibold text-gray-700 hover:text-primary px-4 py-2">
              Become a Provider
            </button>
            <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors">
              Login / Register
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Search Section */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-gray-900 text-white py-12 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
            Trusted Local Workers & Service Providers in Pakistan
          </h1>
          <p className="text-teal-100 text-sm sm:text-base mb-8 max-w-2xl mx-auto">
            Directly discover, compare, and contact skilled carpenters, electricians, masons, mechanics, and technicians near you with zero commission and no bidding wars.
          </p>

          <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl w-full sm:w-auto border border-gray-200">
              <MapPin className="w-5 h-5 text-primary" />
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-gray-800 font-semibold outline-none text-sm cursor-pointer"
              >
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Faisalabad">Faisalabad</option>
                <option value="Peshawar">Peshawar</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl w-full flex-1 border border-gray-200">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search service (e.g. plumber, mason, car mechanic...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent w-full text-gray-800 text-sm outline-none placeholder:text-gray-400"
              />
            </div>

            <button className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-md">
              Search Workers
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Available Professionals in {selectedCity}</h2>
            <p className="text-sm text-gray-500">Showing verified local service providers ready for direct hire</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Sort by:</span>
            <select className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg px-3 py-2 outline-none">
              <option>Nearest First</option>
              <option>Highest Rated</option>
              <option>Lowest Price</option>
              <option>Most Experience</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProviders.map((provider) => (
            <ProviderCard 
              key={provider.id}
              {...provider}
              onViewProfile={() => alert(`Opening profile for ${provider.name}`)}
              onCall={() => alert(`Calling ${provider.name}...`)}
              onChat={() => alert(`Opening chat with ${provider.name}...`)}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-500">
        <p>© 2026 KAAM PAKISTAN. Empowering local Pakistani workforce with digital identity.</p>
      </footer>
    </div>
  );
}