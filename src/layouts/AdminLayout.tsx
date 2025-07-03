
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Settings, User, Home, HelpCircle, FileText, Users, UserMinus } from 'lucide-react';

const AdminLayout = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground mt-2">Please sign in with an admin account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-5">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-slate-400">Manage your application</p>
        </div>
        
        <nav className="space-y-2">
          <NavLink 
            to="/admin" 
            end 
            className={({ isActive }) => 
              `flex items-center p-2 rounded-lg ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <Home size={18} className="mr-2" />
            Dashboard
          </NavLink>
          
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => 
              `flex items-center p-2 rounded-lg ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <User size={18} className="mr-2" />
            Users
          </NavLink>

          <NavLink 
            to="/admin/user-management" 
            className={({ isActive }) => 
              `flex items-center p-2 rounded-lg ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <UserMinus size={18} className="mr-2" />
            User Management
          </NavLink>

          <NavLink 
            to="/admin/questions" 
            className={({ isActive }) => 
              `flex items-center p-2 rounded-lg ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <HelpCircle size={18} className="mr-2" />
            Questions
          </NavLink>

          <NavLink 
            to="/admin/blog" 
            className={({ isActive }) => 
              `flex items-center p-2 rounded-lg ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <FileText size={18} className="mr-2" />
            Blog Posts
          </NavLink>
          
          <NavLink 
            to="/admin/assign-admin" 
            className={({ isActive }) => 
              `flex items-center p-2 rounded-lg ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <Settings size={18} className="mr-2" />
            Assign Admin
          </NavLink>
        </nav>
        
        <div className="mt-auto pt-5 border-t border-slate-800 mt-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'} 
            className="w-full text-zinc-950"
          >
            Back to Site
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
