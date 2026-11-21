import { Link, Outlet, useLocation } from '@tanstack/react-router'

import { ThemeToggle } from '#/components/theme-toggle'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { TooltipProvider } from '#/components/ui/tooltip'
import { SURFACE_BG, normalizeSurfaceLevel } from '#/lib/surface-classes'
import { useSurface } from '#/lib/surface-context'

import { devPages } from './pages'

export function DevLayout() {
  const pathname = useLocation({ select: (location) => location.pathname.replace(/\/$/, '') })
  // The sticky header masks scrolled content, so it paints the level it sits on.
  const surface = normalizeSurfaceLevel(useSurface())

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <p className="px-2 text-sm font-medium">Dev playground</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Test pages</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {devPages.map((page) => (
                    <SidebarMenuItem key={page.to}>
                      <SidebarMenuButton
                        icon={page.icon}
                        isActive={pathname === page.to}
                        render={<Link to={page.to} />}
                      >
                        {page.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <Link
              to="/"
              className="px-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to the site
            </Link>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header
            className={`sticky top-0 z-(--z-sticky) flex h-12 items-center justify-between px-3 ${SURFACE_BG[surface]}`}
          >
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <div className="px-6 pt-4 pb-24 md:px-10">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
