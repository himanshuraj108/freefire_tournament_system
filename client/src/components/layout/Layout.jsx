import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { MessageSquare } from 'lucide-react';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} />
            <main className="pt-20 lg:pl-24 px-4 pb-8 min-h-screen transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* AI Support Widget */}
            <button className="fixed bottom-6 right-6 p-4 bg-neon-blue text-black rounded-full shadow-[0_0_20px_rgba(0,243,255,0.5)] hover:scale-110 transition-transform z-50">
                <MessageSquare className="w-6 h-6" />
            </button>
        </div>
    );
};

export default Layout;
