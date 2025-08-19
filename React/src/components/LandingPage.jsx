import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  ShoppingCart, 
  Video, 
  BarChart3, 
  Users, 
  Settings,
  Truck,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Award,
  Play,
  Sparkles,
  Rocket,
  Globe,
  Eye,
  Target,
  Brain,
  Moon,
  Sun,
  Instagram,
  Facebook,
  Mail,
  Phone,
  MapPin,
  Palette,
  Monitor,
  Megaphone
} from 'lucide-react';
import ClientProjectForm from './ClientProjectForm';

const LandingPage = () => {
  const [theme, setTheme] = useState('dark');
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('FEATURED');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };
  
  const features = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Professional Photography",
      description: "Stunning product photography and professional shoots that capture your brand essence and drive customer engagement.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Megaphone className="w-8 h-8" />,
      title: "Advertising Management",
      description: "Expert ad campaign management across all platforms - Facebook, Instagram, Google Ads with proven ROI results.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Creative Video Production",
      description: "High-quality marketing videos, product demos, and brand stories that engage and convert your audience.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "E-commerce Development",
      description: "Complete online store creation and optimization with integrated payment systems and user-friendly design.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Order Fulfillment",
      description: "Specialized team for order confirmation and delivery tracking to ensure customer satisfaction and repeat business.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Creative Design",
      description: "Professional graphic design for brand identity, marketing materials, and visual content that stands out.",
      gradient: "from-pink-500 to-rose-500"
    }
  ];

  const benefits = [
    "📸 Professional photography that sells",
    "📢 Targeted ads that actually convert", 
    "🎬 Creative videos that engage",
    "🛒 Complete e-commerce solutions",
    "📦 Order fulfillment & delivery",
    "⚡ Fast turnaround times"
  ];

  const testimonials = [
    {
      name: "Ahmed Benali",
      role: "E-commerce Store Owner, Algiers",
      content: "Maze transformed my online business completely. Their photography and advertising increased my sales by 400% in just 3 months!",
      rating: 5,
      avatar: "🛒"
    },
    {
      name: "Leila Kadi", 
      role: "Restaurant Owner, Oran",
      content: "The video content they created for my restaurant went viral! Now I have customers coming from all over the city. Professional service!",
      rating: 5,
      avatar: "🍽️"
    },
    {
      name: "Karim Taleb",
      role: "Tech Startup CEO, Constantine",
      content: "As a B2B company, we needed serious digital presence. Maze delivered a complete solution that brought us enterprise clients.",
      rating: 5,
      avatar: "💼"
    }
  ];

  const stats = [
    { value: "400%", label: "Average Sales Boost", icon: <TrendingUp className="w-8 h-8" /> },
    { value: "500+", label: "Happy Clients", icon: <Users className="w-8 h-8" /> },
    { value: "24hr", label: "Quick Delivery", icon: <Zap className="w-8 h-8" /> },
    { value: "Eulma", label: "Based in Algeria", icon: <MapPin className="w-8 h-8" /> }
  ];

  const services = {
    FEATURED: [
      {
        title: "Complete Business Package",
        description: "Photography + Video + Ads + E-commerce Setup",
        price: "Starting at 50,000 DZD",
        features: ["Professional Product Photography", "6 Marketing Videos", "30-Day Ad Campaign", "Complete Online Store", "Order Management System"],
        popular: true
      },
      {
        title: "Video Content Package", 
        description: "6 Creative Videos (Different Types)",
        price: "Starting at 25,000 DZD",
        features: ["Product Demo Videos", "Brand Story Video", "Social Media Content", "Promotional Videos", "Customer Testimonials", "Professional Editing"],
        popular: false
      }
    ],
    B2B: [
      {
        title: "Enterprise Solution",
        description: "Complete B2B Digital Transformation",
        price: "Custom Pricing",
        features: ["Brand Identity Design", "Professional Website", "Lead Generation System", "Content Marketing Strategy", "Analytics & Reporting"],
        popular: true
      },
      {
        title: "Marketing Consultation",
        description: "Strategic Marketing Planning",
        price: "Starting at 15,000 DZD",
        features: ["Market Analysis", "Competition Research", "Marketing Strategy", "Implementation Plan", "Monthly Reviews"],
        popular: false
      }
    ],
    B2C: [
      {
        title: "Social Media Boost",
        description: "Complete Social Media Management",
        price: "Starting at 20,000 DZD",
        features: ["Content Creation", "Daily Posting", "Community Management", "Instagram & Facebook Ads", "Growth Analytics"],
        popular: true
      },
      {
        title: "Product Photography",
        description: "Professional Product Shoots",
        price: "Starting at 8,000 DZD",
        features: ["Studio Photography", "Lifestyle Shots", "Detail Photography", "Background Removal", "Quick Delivery"],
        popular: false
      }
    ],
    ECOMMERCE: [
      {
        title: "Online Store Complete",
        description: "Full E-commerce Solution",
        price: "Starting at 35,000 DZD",
        features: ["Store Development", "Payment Integration", "Inventory Management", "SEO Optimization", "Mobile Responsive", "Training Included"],
        popular: true
      },
      {
        title: "Store Optimization",
        description: "Improve Existing E-commerce",
        price: "Starting at 18,000 DZD",
        features: ["Performance Audit", "Conversion Optimization", "SEO Improvements", "Speed Optimization", "Mobile Fixes"],
        popular: false
      }
    ]
  };

  return (
    <div className={`min-h-screen overflow-hidden ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Add CSS animation styles */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-50px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes countUp {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes progressFill {
          0% {
            width: 0%;
          }
          100% {
            width: var(--progress-width);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-900/80 border-gray-700/50' 
          : 'bg-white/80 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  MAZE
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                  theme === 'dark'
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 hover:shadow-lg hover:shadow-yellow-400/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-lg hover:shadow-gray-400/20'
                }`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => window.open('mailto:contact@mazedz.com', '_blank')}
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Contact Us
              </button>
              <button
                onClick={() => window.open('https://wa.me/+213XXXXXXXXX?text=مهتم', '_blank')}
                className="relative group bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-purple-600">Professional Business Services</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                Grow
              </span>
              <br />
              <span className={`relative ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Your Business
                <div className="absolute -top-2 -right-8 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce" />
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                with MAZE
              </span>
            </h1>
            
            <p className={`text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Professional photography, targeted advertising, creative videos & complete e-commerce solutions. 
              <span className="text-purple-600 font-semibold"> From Tipaza to the world. </span>
              Transform your brand with our comprehensive business services.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={() => setIsFormOpen(true)}
                className="group relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-12 py-6 rounded-2xl text-xl font-bold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Rocket className="w-6 h-6" />
                  Start Your Project
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              
              <button 
                onClick={() => window.open('https://www.instagram.com/direct/t/17847226293321944', '_blank')}
                className={`group flex items-center gap-4 px-12 py-6 rounded-2xl text-xl font-bold border-2 transition-all duration-300 hover:scale-105 ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:border-purple-500 hover:text-white hover:shadow-lg hover:shadow-purple-500/20'
                    : 'border-gray-300 text-gray-700 hover:border-purple-500 hover:text-purple-600 hover:shadow-lg hover:shadow-purple-500/20'
                }`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                Contact Now
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className={`text-center p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
                }`}>
                  <div className="text-purple-500 mb-2">{stat.icon}</div>
                  <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services & Pricing Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-8">
              <Award className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-600">Our Services</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-black mb-8">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Complete
              </span>
              <br />
              <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                Business Solutions
              </span>
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              From photography to full digital transformation, we've got your business covered.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center mb-16">
            <div className={`inline-flex p-2 rounded-2xl backdrop-blur-xl ${
              theme === 'dark' ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/50 border border-gray-200/50'
            }`}>
              {['FEATURED', 'B2B', 'B2C', 'ECOMMERCE'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab 
                      ? 'bg-white text-gray-900 shadow-lg' 
                      : theme === 'dark' 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {services[activeTab].map((service, index) => (
              <div key={index} className={`relative p-8 rounded-3xl border transition-all duration-300 hover:scale-105 ${
                service.popular 
                  ? 'bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-500/30'
                  : theme === 'dark' 
                    ? 'bg-gray-800/50 border-gray-700/50' 
                    : 'bg-white/50 border-gray-200/50'
              }`}>
                {service.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                  <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {service.description}
                  </p>
                  <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {service.price}
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => window.open('https://wa.me/+213XXXXXXXXX?text=مهتم في ' + service.title, '_blank')}
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
                    service.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:shadow-purple-500/25'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get This Package
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-32 relative ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-8">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-600">What We Offer</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-black mb-8">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Professional
              </span>
              <br />
              <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                Services
              </span>
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Every service is crafted with precision to deliver outstanding results for your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative p-8 rounded-3xl transition-all duration-500 hover:scale-105 hover:rotate-1 cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-gray-900/80 border border-gray-700/50 hover:border-gray-600/50' 
                    : 'bg-white/80 border border-gray-200/50 hover:border-gray-300/50'
                } backdrop-blur-xl hover:shadow-2xl`}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className={`leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-8">
              <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                Trusted by
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Algerian Businesses
              </span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`group relative p-8 rounded-3xl transition-all duration-500 hover:scale-105 cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-gray-900/80 border border-gray-700/50' 
                    : 'bg-white/80 border border-gray-200/50'
                } backdrop-blur-xl hover:shadow-2xl`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="text-4xl mr-4">{testimonial.avatar}</div>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className={`text-lg mb-8 italic leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-bold text-lg">{testimonial.name}</p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={`py-32 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 mb-8">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-green-600">Why Choose Us</span>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  Your Success
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  Is Our Mission
                </span>
              </h2>
              <p className={`text-xl mb-12 leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Join <span className="font-bold text-purple-600">500+ successful businesses</span> across Algeria who trust Maze for their digital growth.
              </p>
              
              {/* Animated Benefits List */}
              <div className="space-y-8">
                {[
                  { 
                    icon: <Camera className="w-6 h-6" />, 
                    text: "Professional photography that sells", 
                    delay: "0ms",
                    gradient: "from-purple-500 to-pink-500"
                  },
                  { 
                    icon: <Megaphone className="w-6 h-6" />, 
                    text: "Targeted ads that actually convert", 
                    delay: "200ms",
                    gradient: "from-blue-500 to-cyan-500"
                  },
                  { 
                    icon: <Video className="w-6 h-6" />, 
                    text: "Creative videos that engage", 
                    delay: "400ms",
                    gradient: "from-green-500 to-emerald-500"
                  },
                  { 
                    icon: <Monitor className="w-6 h-6" />, 
                    text: "Complete e-commerce solutions", 
                    delay: "600ms",
                    gradient: "from-orange-500 to-red-500"
                  },
                  { 
                    icon: <Truck className="w-6 h-6" />, 
                    text: "Order fulfillment & delivery", 
                    delay: "800ms",
                    gradient: "from-indigo-500 to-purple-500"
                  },
                  { 
                    icon: <Zap className="w-6 h-6" />, 
                    text: "Fast turnaround times", 
                    delay: "1000ms",
                    gradient: "from-pink-500 to-rose-500"
                  }
                ].map((benefit, index) => (
                  <div 
                    key={index} 
                    className={`group flex items-center gap-6 p-4 rounded-2xl transition-all duration-500 hover:scale-105 ${
                      theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50/50'
                    }`}
                    style={{
                      animation: `slideInLeft 0.8s ease-out ${benefit.delay} both`
                    }}
                  >
                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      {benefit.icon}
                    </div>
                    <span className="text-xl font-semibold group-hover:text-purple-600 transition-colors duration-300">
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Stats Dashboard */}
            <div className="relative">
              <div className={`relative p-8 rounded-3xl backdrop-blur-xl border ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700/50' 
                  : 'bg-white/50 border-gray-200/50'
              } shadow-2xl`}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-3xl" />
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-8 text-center">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Real Impact
                    </span>
                  </h3>
                  
                  {/* Animated Counter Stats */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                      <div 
                        className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                        style={{ animation: 'countUp 2s ease-out 0.5s both' }}
                      >
                        400%
                      </div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Sales Increase
                      </p>
                    </div>
                    
                    <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                      <div 
                        className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2"
                        style={{ animation: 'countUp 2s ease-out 0.7s both' }}
                      >
                        500+
                      </div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Happy Clients
                      </p>
                    </div>
                    
                    <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                      <div 
                        className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
                        style={{ animation: 'countUp 2s ease-out 0.9s both' }}
                      >
                        24hrs
                      </div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Quick Delivery
                      </p>
                    </div>
                    
                    <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
                      <div 
                        className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2"
                        style={{ animation: 'countUp 2s ease-out 1.1s both' }}
                      >
                        3yrs
                      </div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Experience
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bars */}
                  <div className="mt-8 space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold">Customer Satisfaction</span>
                        <span className="text-sm font-bold text-green-500">98%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          style={{ 
                            width: '98%', 
                            animation: 'progressFill 2s ease-out 1.5s both' 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold">Project Success Rate</span>
                        <span className="text-sm font-bold text-blue-500">96%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ 
                            width: '96%', 
                            animation: 'progressFill 2s ease-out 1.7s both' 
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold">On-Time Delivery</span>
                        <span className="text-sm font-bold text-purple-500">99%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ 
                            width: '99%', 
                            animation: 'progressFill 2s ease-out 1.9s both' 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-blue-600/10" />
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-8">
            <Rocket className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-purple-600">Ready to Start?</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black mb-8">
            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              Transform Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Business Today
            </span>
          </h2>
          <p className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Join 500+ successful businesses in Algeria. 
            <span className="text-purple-600 font-semibold"> Let's grow together.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <button
              onClick={() => setIsFormOpen(true)}
              className="group relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-12 py-6 rounded-2xl text-xl font-bold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6" />
                Get Started Now
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <button
              onClick={() => window.open('mailto:contact@mazedz.com', '_blank')}
              className={`px-12 py-6 rounded-2xl text-xl font-bold border-2 transition-all duration-300 hover:scale-105 ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:border-purple-500 hover:text-white hover:shadow-lg hover:shadow-purple-500/20'
                  : 'border-gray-300 text-gray-700 hover:border-purple-500 hover:text-purple-600 hover:shadow-lg hover:shadow-purple-500/20'
              }`}
            >
              Email Us
            </button>
          </div>
          
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            📞 Quick Response • 🎯 Professional Service • 🛡️ Trusted by 500+ Clients
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 border-t ${
        theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50/50 border-gray-200/50'
      } backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  MAZE
                </h3>
              </div>
              <p className={`text-lg mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Professional business services from Eulma, Algeria. Photography, advertising, videos, and complete digital solutions.
              </p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => window.open('https://instagram.com/maze_services', '_blank')}
                  className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <Instagram className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => window.open('https://facebook.com/maze_services', '_blank')}
                  className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <Facebook className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => window.open('mailto:contact@mazedz.com', '_blank')}
                  className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <Mail className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Services */}
            <div>
              <h4 className="text-xl font-bold mb-6">Our Services</h4>
              <ul className="space-y-3">
                {[
                  'Professional Photography',
                  'Advertising Management', 
                  'Video Production',
                  'E-commerce Development',
                  'Order Fulfillment',
                  'Creative Design'
                ].map((service, index) => (
                  <li key={index}>
                    <button 
                      onClick={() => window.open('https://wa.me/+213XXXXXXXXX?text=مهتم في ' + service, '_blank')}
                      className={`text-left transition-colors hover:text-purple-600 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      {service}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="text-xl font-bold mb-6">Contact Us</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    HFQ8+J7Q, Eulma 42000, Algeria
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-purple-500" />
                  <button 
                    onClick={() => window.open('https://wa.me/+213XXXXXXXXX', '_blank')}
                    className={`transition-colors hover:text-purple-600 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    +213 XXX XXX XXX
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-purple-500" />
                  <button 
                    onClick={() => window.open('mailto:contact@mazedz.com', '_blank')}
                    className={`transition-colors hover:text-purple-600 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    contact@mazedz.com
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700/50 mt-12 pt-8 text-center">
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              © 2024 Maze Services. All rights reserved. 
              <br />
              <span className="text-purple-600 font-semibold">Growing businesses across Algeria.</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Client Project Form Modal */}
      <ClientProjectForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        theme={theme} 
      />
    </div>
  );
};

export default LandingPage;