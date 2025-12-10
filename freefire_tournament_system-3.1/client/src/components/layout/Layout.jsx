import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { MessageSquare } from 'lucide-react';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
            <main className="pt-20 lg:pl-24 px-4 pb-8 min-h-screen transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>


        </div>
    );
};

export default Layout;
