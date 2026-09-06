import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FileText,
  Gauge,
  HandCoins,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import Brand from "./Brand";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/client";
import { money } from "../utils/format";

function SideItem({ to, icon: Icon, children, end = false, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
    >
      <Icon size={18} strokeWidth={1.9} />
      <span>{children}</span>
    </NavLink>
  );
}

function getPageTitle(pathname) {
  if (pathname.includes("/manage-spent")) return "Manage Spent";
  if (pathname.includes("/spent")) return "Spent History";

  const pageTitles = [
    ["/app", "Dashboard"],
    ["/app/community", "Community Feed"],
    ["/app/loans", "Loan Requests"],
    ["/app/my-loans", "My Loans"],
    ["/app/provided-loans/", "Provided Loan Details"],
    ["/app/provided-loans", "Provided Loans"],
    ["/app/crowdfundings/new", "New Crowdfunding"],
    ["/app/crowdfundings/history", "Crowdfundings History"],
    ["/app/crowdfundings/", "Manage Crowdfunding"],
    ["/app/crowdfundings", "Current Crowdfundings"],
    ["/app/my-crowdfundings", "My Crowdfundings"],
    ["/app/transactions", "Transactions"],
    ["/app/profile", "Profile"],
    ["/app/notifications", "Notifications"],
    ["/app/messages", "Messages"],
    ["/app/settings", "Settings"],
    ["/app/admin/crowdfundings", "Admin Approval"],
  ];

  return pageTitles.find(([path]) => pathname === path)?.[1] || null;
}

export default function DashboardLayout() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(true);
  const [crowdOpen, setCrowdOpen] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    refreshUser();
    api("/notifications")
      .then((d) => {
        setNotificationCount(
          (d.notifications || []).filter((n) => !n.is_read).length,
        );
      })
      .catch(() => {});
  }, [location.pathname, refreshUser]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      <div className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand-row">
          <Brand to="/app" />
          <button
            className="icon-button plain sidebar-close"
            onClick={closeMobile}
          >
            <X size={22} />
          </button>
        </div>

        <div className="side-scroll">
          <div className="side-group-label">OVERVIEW</div>
          <SideItem to="/app" end icon={LayoutGrid} onClick={closeMobile}>
            Dashboard
          </SideItem>
          <SideItem to="/app/community" icon={UsersRound} onClick={closeMobile}>
            Community Feed
          </SideItem>

          <div className="side-group-label">FINANCE</div>
          {/* ${loanOpen ? 'open-group' : ''} */}
          <button
            className={`side-link side-toggle`}
            onClick={() => setLoanOpen((v) => !v)}
          >
            <CreditCard size={18} />
            <span>Loan</span>
            <ChevronDown className="side-chevron" size={17} />
          </button>
          {loanOpen && (
            <div className="side-submenu">
              <SideItem
                to="/app/loans"
                icon={CircleDollarSign}
                onClick={closeMobile}
              >
                Explore Loan Requests
              </SideItem>
              <SideItem
                to="/app/my-loans"
                icon={FileText}
                onClick={closeMobile}
              >
                My Loans
              </SideItem>
              <SideItem
                to="/app/provided-loans"
                icon={HandCoins}
                onClick={closeMobile}
              >
                Provided Loans
              </SideItem>
            </div>
          )}
          {/* {${crowdOpen ? 'open-group' : ''}} */}
          <button
            className={`side-link side-toggle`}
            onClick={() => setCrowdOpen((v) => !v)}
          >
            <WalletCards size={18} />
            <span>Crowdfunding</span>
            <ChevronDown className="side-chevron" size={17} />
          </button>
          {crowdOpen && (
            <div className="side-submenu">
              <SideItem
                to="/app/crowdfundings"
                icon={CircleDollarSign}
                onClick={closeMobile}
              >
                Current Crowdfundings
              </SideItem>
              <SideItem
                to="/app/my-crowdfundings"
                icon={FileText}
                onClick={closeMobile}
              >
                My Crowdfundings
              </SideItem>
              <SideItem
                to="/app/crowdfundings/history"
                icon={Gauge}
                onClick={closeMobile}
              >
                Crowdfundings History
              </SideItem>
            </div>
          )}
          <SideItem
            to="/app/transactions"
            icon={FileText}
            onClick={closeMobile}
          >
            Transactions
          </SideItem>

          <div className="side-group-label">COMMUNICATION</div>
          <SideItem
            to="/app/messages"
            icon={MessageSquare}
            onClick={closeMobile}
          >
            Messages
          </SideItem>
          <SideItem to="/app/notifications" icon={Bell} onClick={closeMobile}>
            Notifications
          </SideItem>

          <div className="side-group-label">ACCOUNT</div>
          <SideItem to="/app/profile" icon={UserRound} onClick={closeMobile}>
            Profile
          </SideItem>
          <SideItem to="/app/settings" icon={Settings} onClick={closeMobile}>
            Settings
          </SideItem>
          {user?.role === "admin" && (
            <SideItem
              to="/app/admin/crowdfundings"
              icon={ShieldCheck}
              onClick={closeMobile}
            >
              Admin Approval
            </SideItem>
          )}
        </div>

        <div className="sidebar-user">
          {user?.profile_picture_url ? (
            <img src={user.profile_picture_url} alt={user?.name} />
          ) : (
            <img src="/assets/avatar.jpg" alt={user?.name} />
          )}
          <div className="sidebar-user-details">
            <div className="sidebar-user-name">{user?.name || "UIU User"}</div>
            <div
              className={`sidebar-user-status${user?.is_verified ? " verified" : ""}`}
            >
              {user?.is_verified ? "UIU Verified" : `Not verified`}
            </div>
          </div>
          <div className="account-menu-wrap">
            <button
              className={`icon-button plain account-menu-toggle${accountMenuOpen ? " open" : ""}`}
              onClick={() => setAccountMenuOpen((open) => !open)}
              title="Account menu"
              aria-expanded={accountMenuOpen}
            >
              <ChevronDown size={17} />
            </button>
            {accountMenuOpen && (
              <div className="account-menu">
                <button
                  onClick={() => {
                    setAccountMenuOpen(false);
                    navigate("/app/profile");
                  }}
                >
                  <UserRound size={16} />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    setAccountMenuOpen(false);
                    navigate("/app/settings");
                  }}
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  className="account-menu-logout"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      <main className="app-main">
        {pageTitle && (
          <header className="topbar">
            <button
              className="icon-button plain mobile-menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="topbar-page-title">{pageTitle}</div>
            <div className="topbar-spacer" />
            <div className="top-search">
              <Search size={18} />
              <input placeholder="Search" />
            </div>
            <button className="icon-button round">
              <Settings size={20} />
            </button>
            <button
              className="icon-button round notification-button"
              onClick={() => navigate("/app/notifications")}
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span>{Math.min(notificationCount, 9)}</span>
              )}
            </button>
          </header>
        )}
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
