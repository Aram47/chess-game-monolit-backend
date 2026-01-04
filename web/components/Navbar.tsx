import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Lock, Plus } from 'lucide-react';
import { ROUTES } from '../lib/constants/routes';
import { getAuthUser, clearAuthUser } from '../lib/auth/token';
import { logout } from '../lib/api/auth';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = getAuthUser();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state even if API call fails
      clearAuthUser();
      navigate(ROUTES.LOGIN);
    }
  };

  const navLinks = [
    { path: ROUTES.PUZZLES, label: 'Puzzles' },
    { path: ROUTES.PROBLEMS, label: 'Problems' },
    { path: ROUTES.PLAY, label: 'Play' },
    { path: ROUTES.ANALYSIS, label: 'Analysis', locked: true },
    { path: ROUTES.PROFILE, label: 'Profile' },
  ];

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-slate-900">CHESS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  link.locked ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                onClick={(e) => link.locked && e.preventDefault()}
              >
                <span className="flex items-center gap-1">
                  {link.label}
                  {link.locked && <Lock className="h-3 w-3" />}
                </span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Button asChild variant="default" size="sm">
                  <Link to={ROUTES.PROBLEMS_NEW}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Problem
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.PROFILE} className="cursor-pointer">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to={ROUTES.LOGIN}>Log in</Link>
                </Button>
                <Button asChild>
                  <Link to={ROUTES.REGISTER}>Sign up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block text-sm font-medium transition-colors hover:text-primary ${
                  link.locked ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                onClick={(e) => {
                  if (link.locked) {
                    e.preventDefault();
                  } else {
                    setMobileMenuOpen(false);
                  }
                }}
              >
                <span className="flex items-center gap-1">
                  {link.label}
                  {link.locked && <Lock className="h-3 w-3" />}
                </span>
              </Link>
            ))}
            <div className="pt-4 border-t space-y-2">
              {user ? (
                <>
                  <Button
                    className="w-full justify-start"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to={ROUTES.PROBLEMS_NEW}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Problem
                    </Link>
                  </Button>
                  <Link
                    to={ROUTES.PROFILE}
                    className="block text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to={ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

