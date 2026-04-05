import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  ShieldCheck,
  Search,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Building2,
  Landmark,
  Calendar,
  Filter,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Upload,
  Camera,
  Trash2,
  MoreHorizontal,
  Eye,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { AuthProvider, useAuth } from './AuthContext';
import { Button, Input, Card, FileUpload, TextArea, cn } from './components/UI';
import { 
  EMDRecord, 
  UserProfile, 
  WithdrawalRequest, 
  Notification, 
  EMDType, 
  DepositLocation, 
  DeliveryMethod 
} from './types';
import { format, isAfter, addDays, differenceInDays } from 'date-fns';
import * as XLSX from 'xlsx';

// --- Components ---

const RecordDetailsModal: React.FC<{ record: EMDRecord; onClose: () => void }> = ({ record, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
        <div>
          <h3 className="text-xl font-bold">EMD Details</h3>
          <p className="text-indigo-100 text-sm">Record ID: {record.id}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">EMD Number</p>
            <p className="text-lg font-bold text-slate-900">{record.emdNumber}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Amount</p>
            <p className="text-lg font-bold text-indigo-600">₹{record.emdAmount.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status</p>
            <span className={cn(
              "px-2 py-1 rounded-lg text-xs font-bold inline-block",
              record.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
            )}>
              {record.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              General Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Department:</span> <p className="font-medium">{record.department}</p></div>
              <div><span className="text-slate-500">EMD Type:</span> <p className="font-medium">{record.emdType === 'Other' ? record.emdTypeOther : record.emdType}</p></div>
              <div><span className="text-slate-500">Company:</span> <p className="font-medium">{record.company === 'OTHER' ? record.companyOther : record.company}</p></div>
              <div><span className="text-slate-500">Bank:</span> <p className="font-medium">{record.bank === 'OTHER' ? record.bankOther : record.bank}</p></div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Bid & Timeline
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Bid Number:</span> <p className="font-medium">{record.bidNumber}</p></div>
              <div><span className="text-slate-500">Bid Start:</span> <p className="font-medium">{record.bidStartDate}</p></div>
              <div><span className="text-slate-500">Bid End:</span> <p className="font-medium">{record.bidEndDate}</p></div>
              <div><span className="text-slate-500">Maturity:</span> <p className="font-medium">{record.maturityDate || 'N/A'}</p></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Delivery & Location
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-slate-500">Location:</span> <p className="font-medium">{record.depositLocation}</p></div>
            <div><span className="text-slate-500">Method:</span> <p className="font-medium">{record.deliveryMethod}</p></div>
            <div><span className="text-slate-500">Delivery Date:</span> <p className="font-medium">{record.deliveryDate || 'N/A'}</p></div>
            {record.trackingId && <div className="col-span-full"><span className="text-slate-500">Tracking ID:</span> <p className="font-medium">{record.trackingId}</p></div>}
            {record.status === 'Withdrawn' && record.withdrawalDate && (
              <div className="col-span-full bg-rose-50 p-3 rounded-xl border border-rose-100">
                <span className="text-rose-500 font-bold text-xs uppercase">Withdrawal Information</span>
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div><span className="text-slate-500">Withdrawal Date:</span> <p className="font-bold text-rose-600">{record.withdrawalDate}</p></div>
                  {record.returnMethod && <div><span className="text-slate-500">Return Method:</span> <p className="font-bold text-rose-600">{record.returnMethod}</p></div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {record.notes && (
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">Notes</h4>
            <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">{record.notes}</p>
          </div>
        )}

        {record.photos && record.photos.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900">EMD Documents</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {record.photos.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-indigo-400 transition-all">
                  <img src={url} alt={`EMD ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="text-white w-6 h-6" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {record.courierReceiptPhoto && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900">Courier Receipt</h4>
            <div className="w-48 aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <a href={record.courierReceiptPhoto} target="_blank" rel="noopener noreferrer" className="group relative block w-full h-full">
                <img src={record.courierReceiptPhoto} alt="Courier Receipt" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="text-white w-6 h-6" />
                </div>
              </a>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6 border-t border-slate-100 flex justify-end">
        <Button onClick={onClose}>Close Details</Button>
      </div>
    </motion.div>
  </div>
);

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick: () => void;
  badge?: number;
}> = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all group",
      active 
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <div className="flex items-center gap-3">
      <span className={cn("transition-colors", active ? "text-white" : "text-slate-400 group-hover:text-slate-600")}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </div>
    {badge ? (
      <span className={cn(
        "px-2 py-0.5 text-xs font-bold rounded-full",
        active ? "bg-white text-indigo-600" : "bg-indigo-100 text-indigo-600"
      )}>
        {badge}
      </span>
    ) : (
      <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", active && "opacity-100")} />
    )}
  </button>
);

const StatCard: React.FC<{ 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose';
}> = ({ label, value, icon, trend, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <Card className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl", colors[color])}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
    </Card>
  );
};

// --- Pages ---

const WelcomeScreen: React.FC<{ onLogin: () => void; onCreate: () => void }> = ({ onLogin, onCreate }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full space-y-8"
    >
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200 mb-6">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">EMD Tracker Pro</h1>
        <p className="text-slate-500 mt-3 text-lg">Secure enterprise management for government tender deposits.</p>
      </div>

      <div className="grid gap-4 pt-8">
        <Button size="lg" onClick={onLogin} className="w-full h-14 text-lg">
          Login to Account
        </Button>
        <Button size="lg" variant="outline" onClick={onCreate} className="w-full h-14 text-lg">
          Create New Account
        </Button>
      </div>

      <p className="text-slate-400 text-sm pt-8">
        Trusted by 500+ tender management companies worldwide.
      </p>
    </motion.div>
  </div>
);

const AuthPage: React.FC<{ 
  mode: 'login' | 'signup' | 'forgot-password'; 
  onToggle: (mode: 'login' | 'signup' | 'forgot-password') => void;
}> = ({ mode, onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const isAdminEmail = email === 'karan.gupta.4977@gmail.com' || email === 'demo@emdtracker.com';
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          fullName,
          mobileNumber: mobile,
          email,
          status: isAdminEmail ? 'Approved' : 'Pending',
          role: isAdminEmail ? 'Owner' : 'Employee',
          permissions: isAdminEmail ? 'All Access' : 'Only View',
          createdAt: serverTimestamp(),
        });
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error("DEBUG: Firebase Auth Failure:", err);
      setError(err.message);
      if (mode === 'login') {
        await signOut(auth);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'signup' ? 'Create Account' : mode === 'forgot-password' ? 'Reset Password' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 mt-1">
              {mode === 'signup' ? 'Join the EMD management platform' : mode === 'forgot-password' ? 'Enter your email to receive a reset link' : 'Enter your credentials to continue'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Input 
                  label="Full Name" 
                  placeholder="John Doe" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Input 
                  label="Mobile Number" 
                  placeholder="+91 9876543210" 
                  required 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </>
            )}
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="john@example.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {mode !== 'forgot-password' && (
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}

            {error && <p className="text-sm text-rose-500 bg-rose-50 p-3 rounded-lg">{error}</p>}
            {message && <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">{message}</p>}

            <Button type="submit" loading={loading} className="w-full h-12 mt-4">
              {mode === 'signup' ? 'Create Account' : mode === 'forgot-password' ? 'Send Reset Link' : 'Login'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
            {mode === 'login' && (
              <button onClick={() => onToggle('forgot-password')} type="button" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
                Forgot Password?
              </button>
            )}
            <button onClick={() => onToggle(mode === 'signup' ? 'login' : 'signup')} type="button" className="text-indigo-600 font-medium hover:underline">
              {mode === 'signup' ? 'Already have an account? Login' : "Don't have an account? Sign up"}
            </button>
            {mode === 'forgot-password' && (
              <button onClick={() => onToggle('login')} type="button" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors mt-2">
                Back to Login
              </button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

const PendingApproval: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full space-y-6"
    >
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
        <Clock className="w-10 h-10 text-amber-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Account Pending Approval</h2>
      <p className="text-slate-500">
        Your account has been created successfully. Please wait for an administrator to approve your access.
      </p>
      <div className="pt-4">
        <Button variant="outline" onClick={() => signOut(auth)}>
          Sign Out
        </Button>
      </div>
    </motion.div>
  </div>
);

// --- Main App Content ---

export default function App() {
  const { user, profile, loading, isAuthReady } = useAuth();
  const [authMode, setAuthMode] = useState<'welcome' | 'login' | 'signup' | 'forgot-password'>('welcome');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?.permissions === 'Add/Withdraw Only' && activeTab === 'dashboard') {
      setActiveTab('add-emd');
    }
  }, [profile, activeTab]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('targetUser', '==', user.uid),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user]);

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authMode === 'welcome') return <WelcomeScreen onLogin={() => setAuthMode('login')} onCreate={() => setAuthMode('signup')} />;
    return (
      <AuthPage 
        mode={authMode === 'welcome' ? 'login' : authMode} 
        onToggle={(m) => setAuthMode(m)} 
      />
    );
  }

  if (profile?.status === 'Pending' && profile?.role !== 'Owner') return <PendingApproval />;
  if (profile?.status === 'Rejected') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <Card className="max-w-md">
        <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 mt-2">Your account approval was rejected. Please contact support.</p>
        <Button className="mt-6" variant="outline" onClick={() => signOut(auth)}>Sign Out</Button>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-100 z-50 flex flex-col shadow-xl lg:shadow-none"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="font-bold text-xl text-slate-900">EMD Tracker</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
              {profile?.permissions !== 'Add/Withdraw Only' && <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />}
              <SidebarItem icon={<PlusCircle className="w-5 h-5" />} label="Add EMD" active={activeTab === 'add-emd'} onClick={() => setActiveTab('add-emd')} />
              <SidebarItem icon={<ArrowDownLeft className="w-5 h-5" />} label="Withdraw EMD" active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')} />
              {profile?.permissions !== 'Add/Withdraw Only' && <SidebarItem icon={<History className="w-5 h-5" />} label="Records" active={activeTab === 'records'} onClick={() => setActiveTab('records')} />}
              {profile?.permissions !== 'Add/Withdraw Only' && <SidebarItem icon={<AlertTriangle className="w-5 h-5" />} label="Risk Monitor" active={activeTab === 'risk'} onClick={() => setActiveTab('risk')} />}
              {profile?.permissions !== 'Add/Withdraw Only' && <SidebarItem icon={<Bell className="w-5 h-5" />} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} badge={unreadCount} />}
              
              {profile?.role === 'Owner' && (
                <div className="pt-6 mt-6 border-t border-slate-100">
                  <p className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Panel</p>
                  <SidebarItem icon={<Users className="w-5 h-5" />} label="User Management" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                  <SidebarItem icon={<FileSpreadsheet className="w-5 h-5" />} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                </div>
              )}
            </div>

            <div className="p-4 mt-auto border-t border-slate-100">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{profile?.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">{profile?.role}</p>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => signOut(auth)}>
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col transition-all duration-300", isSidebarOpen ? "lg:ml-72" : "ml-0")}>
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 hover:text-slate-600">
                <Menu className="w-6 h-6" />
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('notifications')}
              className="p-2 text-slate-400 hover:text-slate-600 relative"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardView onViewAll={() => setActiveTab('records')} />}
              {activeTab === 'add-emd' && <AddEMDView />}
              {activeTab === 'records' && <RecordsView />}
              {activeTab === 'withdraw' && <WithdrawView />}
              {activeTab === 'risk' && <RiskMonitorView />}
              {activeTab === 'notifications' && <NotificationsView />}
              {activeTab === 'users' && <UserManagementView />}
              {activeTab === 'reports' && <ReportsView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- View Components ---

function DashboardView({ onViewAll }: { onViewAll: () => void }) {
  const [records, setRecords] = useState<EMDRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<EMDRecord | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'emd_records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EMDRecord));
      // Sort: Active first, then by createdAt desc
      const sorted = [...allRecords].sort((a, b) => {
        if (a.status === 'Active' && b.status !== 'Active') return -1;
        if (a.status !== 'Active' && b.status === 'Active') return 1;
        return 0; // Maintain createdAt desc order within groups
      });
      setRecords(sorted.slice(0, 5));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const stats = {
    totalActive: records.filter(r => r.status === 'Active').length,
    totalAmount: records.reduce((acc, r) => acc + (r.status === 'Active' ? r.emdAmount : 0), 0),
    fdAmount: records.reduce((acc, r) => acc + (r.emdType === 'FD' && r.status === 'Active' ? r.emdAmount : 0), 0),
    bgAmount: records.reduce((acc, r) => acc + (r.emdType === 'BG' && r.status === 'Active' ? r.emdAmount : 0), 0),
  };

  return (
    <div className="space-y-8">
      {selectedRecord && <RecordDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Active EMD" value={stats.totalActive} icon={<FileText className="w-6 h-6" />} color="indigo" trend="+12%" />
        <StatCard label="Total EMD Amount" value={`₹${stats.totalAmount.toLocaleString()}`} icon={<Landmark className="w-6 h-6" />} color="emerald" />
        <StatCard label="FD Amount" value={`₹${stats.fdAmount.toLocaleString()}`} icon={<Building2 className="w-6 h-6" />} color="amber" />
        <StatCard label="BG Amount" value={`₹${stats.bgAmount.toLocaleString()}`} icon={<ShieldCheck className="w-6 h-6" />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent EMD Entries</h3>
            <Button variant="ghost" size="sm" onClick={onViewAll}>View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">EMD Number</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Department</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Amount</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((record) => (
                  <tr key={record.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-medium text-slate-900">{record.emdNumber}</td>
                    <td className="py-4 text-slate-600">{record.department}</td>
                    <td className="py-4 font-bold text-slate-900">₹{record.emdAmount.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold",
                        record.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {record.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRecord(record)}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-6">Upcoming Maturities</h3>
          <div className="space-y-4">
            {records.filter(r => r.maturityDate).map((record) => (
              <div key={record.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-50 hover:border-indigo-100 transition-all">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{record.emdNumber}</p>
                  <p className="text-xs text-slate-500">{record.maturityDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-600">
                    {differenceInDays(new Date(record.maturityDate!), new Date())} days
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AddEMDView() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EMDRecord>>({
    emdType: 'FD',
    status: 'Active',
    photos: []
  });

  const handleFileUpload = async (file: File, field: 'photos' | 'courierReceiptPhoto') => {
    if (!user) return;
    setUploading(field);
    try {
      const storageRef = ref(storage, `emd/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      if (field === 'photos') {
        setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), url] }));
      } else {
        setFormData(prev => ({ ...prev, [field]: url }));
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Validate required fields
      const requiredFields = ['emdType', 'emdNumber', 'emdAmount', 'bidNumber', 'department', 'depositLocation', 'company', 'bank', 'status'];
      const missingFields = requiredFields.filter(f => !formData[f as keyof EMDRecord]);
      
      if (missingFields.length > 0) {
        alert(`Please fill in all mandatory fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'emd_records'), {
        ...formData,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      alert('EMD Record Added Successfully!');
      setStep(1);
      setFormData({ emdType: 'FD', status: 'Active', photos: [] });
    } catch (err: any) {
      console.error("Firestore Error:", err);
      if (err.message?.includes('insufficient permissions')) {
        alert("Permission Denied: You may not have the required approval or role to add records.");
      } else {
        alert(`Failed to save record: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-0 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white">
          <h3 className="text-2xl font-bold">Add New EMD Record</h3>
          <p className="text-indigo-100 mt-1">Fill in all mandatory details to track a new deposit.</p>
          
          <div className="flex items-center gap-4 mt-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                  step === s ? "bg-white text-indigo-600 scale-110" : "bg-indigo-500 text-indigo-200"
                )}>
                  {s}
                </div>
                {s < 4 && <div className="w-8 h-0.5 bg-indigo-500" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">EMD Type</label>
                    <select 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.emdType}
                      onChange={(e) => setFormData({ ...formData, emdType: e.target.value as EMDType })}
                    >
                      <option value="FD">Fixed Deposit (FD)</option>
                      <option value="DD">Demand Draft (DD)</option>
                      <option value="BG">Bank Guarantee (BG)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {formData.emdType === 'Other' && (
                    <Input 
                      label="Specify EMD Type" 
                      required 
                      value={formData.emdTypeOther} 
                      onChange={(e) => setFormData({ ...formData, emdTypeOther: e.target.value })} 
                    />
                  )}
                  <Input label="EMD Number" required value={formData.emdNumber} onChange={(e) => setFormData({ ...formData, emdNumber: e.target.value })} />
                  <Input label="EMD Amount" type="number" required value={formData.emdAmount} onChange={(e) => setFormData({ ...formData, emdAmount: Number(e.target.value) })} />
                  <Input label="Department" required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)}>Next Step</Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Bid Number" required value={formData.bidNumber} onChange={(e) => setFormData({ ...formData, bidNumber: e.target.value })} />
                  <Input label="Bid Start Date" type="date" required value={formData.bidStartDate} onChange={(e) => setFormData({ ...formData, bidStartDate: e.target.value })} />
                  <Input label="Bid End Date" type="date" required value={formData.bidEndDate} onChange={(e) => setFormData({ ...formData, bidEndDate: e.target.value })} />
                  {(formData.emdType === 'FD' || formData.emdType === 'BG') && (
                    <Input label="Maturity Date" type="date" required value={formData.maturityDate} onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })} />
                  )}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>Previous</Button>
                  <Button onClick={() => setStep(3)}>Next Step</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Company</label>
                    <select 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    >
                      <option value="">Select Company</option>
                      <option value="SHIKHA ENTERPRISES">SHIKHA ENTERPRISES</option>
                      <option value="AASHIRVAAD MARKETING">AASHIRVAAD MARKETING</option>
                      <option value="HANUMAN ENTERPRISES">HANUMAN ENTERPRISES</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  {formData.company === 'OTHER' && (
                    <Input 
                      label="Specify Company Name" 
                      required 
                      value={formData.companyOther} 
                      onChange={(e) => setFormData({ ...formData, companyOther: e.target.value })} 
                    />
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Bank</label>
                    <select 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    >
                      <option value="">Select Bank</option>
                      <option value="CANARA BANK">CANARA BANK</option>
                      <option value="HDFC BANK">HDFC BANK</option>
                      <option value="SBI">SBI</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  {formData.bank === 'OTHER' && (
                    <Input 
                      label="Specify Bank Name" 
                      required 
                      value={formData.bankOther} 
                      onChange={(e) => setFormData({ ...formData, bankOther: e.target.value })} 
                    />
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Deposit Location</label>
                    <select 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.depositLocation}
                      onChange={(e) => setFormData({ ...formData, depositLocation: e.target.value as DepositLocation })}
                    >
                      <option value="">Select Location</option>
                      <option value="Deposited in Department">Deposited in Department</option>
                      <option value="In Office / Home">In Office / Home</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Delivery Method</label>
                    <select 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.deliveryMethod}
                      onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value as DeliveryMethod })}
                    >
                      <option value="">Select Method</option>
                      <option value="BY HAND">BY HAND</option>
                      <option value="BY POST">BY POST</option>
                    </select>
                  </div>
                  {(formData.deliveryMethod === 'BY HAND' || formData.deliveryMethod === 'BY POST') && (
                    <Input 
                      label="Delivery Date" 
                      type="date" 
                      value={formData.deliveryDate} 
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} 
                    />
                  )}
                  {formData.deliveryMethod === 'BY POST' && (
                    <>
                      <Input 
                        label="Tracking ID" 
                        value={formData.trackingId} 
                        onChange={(e) => setFormData({ ...formData, trackingId: e.target.value })} 
                      />
                      <FileUpload 
                        label="Courier Receipt Photo" 
                        loading={uploading === 'courierReceiptPhoto'}
                        onUpload={(file) => handleFileUpload(file as any, 'courierReceiptPhoto')}
                      />
                      {formData.courierReceiptPhoto && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                          <img src={formData.courierReceiptPhoto} alt="Receipt" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setFormData(prev => ({ ...prev, courierReceiptPhoto: undefined }))}
                            className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  <div className="col-span-full space-y-3">
                    <FileUpload 
                      label="EMD Document Photos" 
                      loading={uploading === 'photos'}
                      onUpload={(file) => handleFileUpload(file as any, 'photos')}
                    />
                    <div className="flex flex-wrap gap-3">
                      {formData.photos?.map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                          <img src={url} alt={`EMD ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setFormData(prev => ({ ...prev, photos: prev.photos?.filter((_, i) => i !== idx) }))}
                            className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-full">
                    <TextArea 
                      label="Notes" 
                      placeholder="Add any additional notes or details here..." 
                      value={formData.notes} 
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Previous</Button>
                  <Button onClick={() => setStep(4)}>Final Review</Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">Review Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-500">EMD Number:</span> <span className="font-bold">{formData.emdNumber}</span></div>
                    <div><span className="text-slate-500">Amount:</span> <span className="font-bold">₹{formData.emdAmount?.toLocaleString()}</span></div>
                    <div><span className="text-slate-500">Department:</span> <span className="font-bold">{formData.department}</span></div>
                    <div><span className="text-slate-500">Type:</span> <span className="font-bold">{formData.emdType}</span></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>Previous</Button>
                  <Button loading={loading} onClick={handleSubmit}>Submit & Save Record</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}

function RecordsView() {
  const [records, setRecords] = useState<EMDRecord[]>([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Withdrawn'>('All');
  const [selectedRecord, setSelectedRecord] = useState<EMDRecord | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'emd_records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EMDRecord));
      // Sort: Active first, then by createdAt desc
      const sorted = [...allRecords].sort((a, b) => {
        if (a.status === 'Active' && b.status !== 'Active') return -1;
        if (a.status !== 'Active' && b.status === 'Active') return 1;
        return 0; // Maintain createdAt desc order within groups
      });
      setRecords(sorted);
    });
    return () => unsubscribe();
  }, []);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.emdNumber.toLowerCase().includes(filter.toLowerCase()) ||
                         r.department.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {selectedRecord && <RecordDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Search by EMD number or department..." 
            className="pl-10"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            {(['All', 'Active', 'Withdrawn'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-4 py-1.5 text-sm font-bold rounded-lg transition-all",
                  statusFilter === s 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <Button variant="outline" className="flex-1 md:flex-none" onClick={() => {
            const ws = XLSX.utils.json_to_sheet(records);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "EMD Records");
            XLSX.writeFile(wb, "EMD_Records.xlsx");
          }}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-all group cursor-pointer border-l-4 border-l-indigo-600">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{record.emdType}</p>
                <h4 className="text-lg font-bold text-slate-900 mt-1">{record.emdNumber}</h4>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-lg text-xs font-bold",
                record.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
              )}>
                {record.status}
              </span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Building2 className="w-4 h-4" />
                <span>{record.department}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Landmark className="w-4 h-4" />
                <span>{record.bank}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <p className="text-lg font-bold text-slate-900">₹{record.emdAmount.toLocaleString()}</p>
              <Button size="sm" variant="ghost" onClick={() => setSelectedRecord(record)}>Details <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WithdrawView() {
  const [emdNumber, setEmdNumber] = useState('');
  const [record, setRecord] = useState<EMDRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [withdrawalDate, setWithdrawalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [returnMethod, setReturnMethod] = useState('Bank Transfer');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'emd_records'), where('emdNumber', '==', emdNumber), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError('EMD Record not found.');
        setRecord(null);
      } else {
        const data = snapshot.docs[0].data() as EMDRecord;
        if (data.status === 'Withdrawn') {
          setError('This EMD has already been withdrawn.');
          setRecord(null);
        } else {
          setRecord({ id: snapshot.docs[0].id, ...data });
        }
      }
    } catch (err) {
      setError('Error searching for record.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!record) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'emd_records', record.id), {
        status: 'Withdrawn',
        withdrawalDate,
        returnMethod,
        updatedAt: serverTimestamp()
      });
      alert('EMD Withdrawn Successfully!');
      setRecord(null);
      setEmdNumber('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <h3 className="text-xl font-bold text-slate-900 mb-6">Withdraw EMD</h3>
        <div className="flex gap-3">
          <Input 
            placeholder="Enter EMD Number..." 
            value={emdNumber}
            onChange={(e) => setEmdNumber(e.target.value)}
          />
          <Button loading={loading} onClick={handleSearch}>Search</Button>
        </div>
        {error && <p className="text-sm text-rose-500 mt-3 bg-rose-50 p-3 rounded-lg">{error}</p>}
      </Card>

      {record && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl">
              <h4 className="font-bold text-slate-900 mb-4">Record Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Department:</span> <span className="font-bold">{record.department}</span></div>
                <div><span className="text-slate-500">Amount:</span> <span className="font-bold">₹{record.emdAmount.toLocaleString()}</span></div>
                <div><span className="text-slate-500">Company:</span> <span className="font-bold">{record.company}</span></div>
                <div><span className="text-slate-500">Bank:</span> <span className="font-bold">{record.bank}</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <Input 
                label="Withdrawal Date" 
                type="date" 
                value={withdrawalDate} 
                onChange={(e) => setWithdrawalDate(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Return Method</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={returnMethod}
                  onChange={(e) => setReturnMethod(e.target.value)}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Physical DD Return">Physical DD Return</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <Button className="w-full h-12" loading={loading} onClick={handleWithdraw}>Confirm Withdrawal</Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function RiskMonitorView() {
  const [records, setRecords] = useState<EMDRecord[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'emd_records'), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EMDRecord)));
    });
    return () => unsubscribe();
  }, []);

  const risks = {
    stuck: records.filter(r => differenceInDays(new Date(), new Date(r.createdAt.toDate())) > 60),
    expiringSoon: records.filter(r => r.maturityDate && differenceInDays(new Date(r.maturityDate), new Date()) < 30),
    bidEnding: records.filter(r => differenceInDays(new Date(r.bidEndDate), new Date()) < 7),
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Stuck > 60 Days" value={risks.stuck.length} icon={<Clock className="w-6 h-6" />} color="rose" />
        <StatCard label="Expiring < 30 Days" value={risks.expiringSoon.length} icon={<AlertTriangle className="w-6 h-6" />} color="amber" />
        <StatCard label="Bid Ending Soon" value={risks.bidEnding.length} icon={<Calendar className="w-6 h-6" />} color="indigo" />
      </div>

      <Card>
        <h3 className="text-lg font-bold text-slate-900 mb-6">High Risk EMDs</h3>
        <div className="space-y-4">
          {risks.stuck.map(record => (
            <div key={record.id} className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{record.emdNumber}</p>
                  <p className="text-xs text-slate-500">{record.department} • Stuck for {differenceInDays(new Date(), new Date(record.createdAt.toDate()))} days</p>
                </div>
              </div>
              <Button size="sm" variant="danger">Action Required</Button>
            </div>
          ))}
          {risks.stuck.length === 0 && <p className="text-center py-8 text-slate-400">No high risk EMDs found.</p>}
        </div>
      </Card>
    </div>
  );
}

function UserManagementView() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermissionChange = async (userId: string, permissions: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { permissions });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-slate-100">
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">User</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Status</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Permissions</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr key={user.uid} className="group hover:bg-slate-50 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                      {user.fullName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user.fullName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-xs font-bold",
                    user.status === 'Approved' ? "bg-emerald-50 text-emerald-600" : 
                    user.status === 'Pending' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4">
                  <select 
                    value={user.permissions || (user.role === 'Owner' ? 'All Access' : 'Only View')} 
                    onChange={(e) => handlePermissionChange(user.uid, e.target.value)}
                    className="border border-slate-200 rounded-lg p-2 text-sm bg-white text-slate-700 outline-none focus:border-indigo-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={user.role === 'Owner'}
                  >
                    <option value="All Access">All Access</option>
                    <option value="Only View">Only View</option>
                    <option value="Add/Withdraw Only">Add/Withdraw Only</option>
                  </select>
                </td>
                <td className="py-4 text-right">
                  {user.status === 'Pending' && (
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={() => handleStatusChange(user.uid, 'Approved')}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => handleStatusChange(user.uid, 'Rejected')}>Reject</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ReportsView() {
  const [records, setRecords] = useState<EMDRecord[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'emd_records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EMDRecord)));
    });
    return () => unsubscribe();
  }, []);

  const generateReport = (type: 'department' | 'company') => {
    if (records.length === 0) {
      alert("No records found to generate report.");
      return;
    }

    // Prepare data for Excel
    const data = records.map(r => ({
      'EMD Number': r.emdNumber,
      'Type': r.emdType,
      'Amount': r.emdAmount,
      'Department': r.department,
      'Company': r.company,
      'Bank': r.bank,
      'Status': r.status,
      'Bid Number': r.bidNumber,
      'Bid Start': r.bidStartDate,
      'Bid End': r.bidEndDate,
      'Maturity Date': r.maturityDate || 'N/A',
      'Created At': r.createdAt?.toDate ? format(r.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'
    }));

    // Sort based on report type
    if (type === 'department') {
      data.sort((a, b) => a.Department.localeCompare(b.Department));
    } else {
      data.sort((a, b) => a.Company.localeCompare(b.Company));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "EMD Report");
    XLSX.writeFile(wb, `EMD_Report_${type}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
          <FileSpreadsheet className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Department-wise EMD</h3>
        <p className="text-slate-500">Generate a comprehensive report of all EMDs grouped by government departments.</p>
        <Button className="w-full" onClick={() => generateReport('department')}>Generate Excel Report</Button>
      </Card>
      <Card className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
          <Building2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Company-wise EMD</h3>
        <p className="text-slate-500">Track EMD distribution across different sister companies and entities.</p>
        <Button className="w-full" onClick={() => generateReport('company')}>Generate Excel Report</Button>
      </Card>
    </div>
  );
}

function NotificationsView() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('targetUser', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    try {
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Your Notifications</h3>
        {notifications.some(n => !n.read) && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>Mark all as read</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">No notifications yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={cn(
                "p-4 rounded-2xl border transition-all flex gap-4 items-start cursor-pointer",
                n.read ? "bg-white border-slate-100 opacity-75" : "bg-indigo-50/30 border-indigo-100 shadow-sm"
              )}
              onClick={() => !n.read && markAsRead(n.id)}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                n.type === 'Maturity' ? "bg-amber-100 text-amber-600" :
                n.type === 'Withdrawal' ? "bg-rose-100 text-rose-600" :
                n.type === 'Approval' ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
              )}>
                {n.type === 'Maturity' ? <Clock className="w-5 h-5" /> :
                 n.type === 'Withdrawal' ? <ArrowDownLeft className="w-5 h-5" /> :
                 n.type === 'Approval' ? <ShieldCheck className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-slate-900 truncate">{n.title}</p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">
                    {n.createdAt?.toDate ? format(n.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                  </p>
                </div>
                <p className="text-sm text-slate-600 mt-1">{n.message}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
