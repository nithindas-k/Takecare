import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
   
        const dashboardRoutes = ['/doctor', '/patient', '/admin'];
        const isDashboardRoute = dashboardRoutes.some(route => pathname.startsWith(route));

        if (!isDashboardRoute) {
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
};

export default ScrollToTop;
