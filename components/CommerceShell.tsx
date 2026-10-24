"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type WorkspaceLink = { label: string; href: string; icon: string; exact?: boolean };
const sellerLinks: WorkspaceLink[] = [
  { href: "/seller", label: "Overview", icon: "◫", exact: true },
  { href: "/seller/products", label: "Products", icon: "▦", exact: true },
  { href: "/seller/products/new", label: "Add product", icon: "＋" },
  { href: "/seller/orders", label: "Customer orders", icon: "▤" },
  { href: "/seller/withdrawals", label: "Withdrawal requests", icon: "◇" },
  { href: "/seller/payment-protection", label: "Payment protection", icon: "◇" },
  { href: "/chat", label: "Messages", icon: "✉" },
  { href: "/notifications", label: "Notifications", icon: "♧" },
];
const adminLinks: WorkspaceLink[] = [
  { href: "/admin", label: "Overview", icon: "◫", exact: true },
  { href: "/admin/ai", label: "AI Admin", icon: "✧" },
  { href: "/admin/monitoring", label: "Monitoring", icon: "◎" },
  { href: "/admin/reports", label: "Reports", icon: "▥" },
  { href: "/admin/withdrawals", label: "Withdrawal reviews", icon: "◇" },
  { href: "/admin/refunds", label: "Refunds", icon: "↶" },
  { href: "/admin/support", label: "Support inbox", icon: "✉" },
  { href: "/admin/support-assistant", label: "Support assistant", icon: "✦" },
];
const otherLinks: WorkspaceLink[] = [
  { href: "/", label: "Visit marketplace", icon: "↗" },
  { href: "/account", label: "My account", icon: "◉" },
];

function isActive(href:string, exact:boolean|undefined, current:string){
  return exact ? current === href : current === href || current.startsWith(href + "/");
}

function WorkspaceNav({ links, pathname, mobile = false }: {
  links:WorkspaceLink[]; pathname:string; mobile?:boolean;
}){
  return <nav aria-label={mobile ? "Workspace mobile navigation" : "Workspace navigation"}
    className={mobile ? "gm-workspace-mobile-nav" : "gm-workspace-nav"}>
    {links.map(item => <Link href={item.href} key={item.href}
      aria-current={isActive(item.href, item.exact, pathname) ? "page" : undefined}
      className={"gm-workspace-link" + (isActive(item.href, item.exact, pathname) ? " is-active" : "")}>
      <span aria-hidden="true" className="gm-workspace-link-icon">{item.icon}</span>
      <span>{item.label}</span>
    </Link>)}
  </nav>;
}

export default function CommerceShell({children}:{children:ReactNode}){
  const pathname=usePathname()||"/";
  const zone=pathname.startsWith("/admin") ? "admin" :
    pathname.startsWith("/seller") ? "seller" : "buyer";
  if(zone==="buyer"){
    return <div className="gm-zone gm-zone-buyer">
      <div className="gm-announcement"><span className="gm-announcement-spark" aria-hidden="true">✦</span>
        A better way to discover independent stores
        <Link href="/help">Need help? <span aria-hidden="true">↗</span></Link>
      </div>
      {children}
    </div>;
  }
  const links=zone==="admin"?adminLinks:sellerLinks;
  const title=zone==="admin"?"Admin command center":"Seller Studio";
  const subtitle=zone==="admin"?"Manage operations, insights and AI tools":"Build your store. Manage every detail.";
  const current=links.find(l=>isActive(l.href,l.exact,pathname));
  return <div className={"gm-zone gm-zone-"+zone}>
    <div className="gm-workspace-frame">
      <aside className="gm-workspace-sidebar" aria-label={title}>
        <Link href="/" className="gm-sidebar-brand" aria-label="GoldMart homepage">
          <span className="gm-brand-symbol" aria-hidden="true">G</span>
          <span>Gold<span className="gm-brand-accent">Mart</span>
            <small>COMMERCE</small>
          </span>
        </Link>
        <div className="gm-sidebar-workspace-id"><span className="gm-workspace-dot" />
          <div><p>{title}</p><small>{zone==="admin"?"Operations workspace":"Your selling workspace"}</small></div>
        </div>
        <div className="gm-sidebar-nav-title">WORKSPACE</div>
        <WorkspaceNav links={links} pathname={pathname}/>
        <div className="gm-sidebar-bottom">
          <div className="gm-sidebar-nav-title">QUICK ACCESS</div>
          <WorkspaceNav links={otherLinks} pathname={pathname}/>
          <div className="gm-sidebar-footnote"><span className="gm-workspace-dot" /> GoldMart · Built to grow</div>
        </div>
      </aside>
      <div className="gm-workspace-content">
        <header className="gm-workspace-topbar">
          <div className="gm-workspace-topbar-left">
            <span className="gm-topbar-eyebrow">{zone==="admin"?"OPERATIONS":"SELLING"} / {current?.label||title}</span>
            <div className="gm-topbar-title">{title}<span className="gm-topbar-mobile-context"> · {current?.label||"Workspace"}</span></div>
          </div>
          <div className="gm-workspace-topbar-actions">
            <Link href={zone==="admin"?"/admin/monitoring":"/seller/products/new"} className="gm-topbar-action-secondary">
              {zone==="admin"?"◎ Monitoring":"+ Add product"}
            </Link>
            <Link href="/" className="gm-topbar-marketplace-link">View store <span aria-hidden="true">↗</span></Link>
          </div>
        </header>
        <div className="gm-workspace-mobile">
          <p>{subtitle}</p>
          <WorkspaceNav links={links} pathname={pathname} mobile/>
        </div>
        <div className="gm-workspace-page">{children}</div>
      </div>
    </div>
  </div>;
}
