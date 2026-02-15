import React from 'react';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export function Footer() {
    return (
        <footer className="relative border-t border-white/10 bg-[hsl(240,10%,6%)]/50 px-6 py-12 mt-12">
            <div className="max-w-[75rem] mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h4 className="mb-4 text-[hsl(220,12%,98%)]">Product</h4>
                        <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Security</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Roadmap</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 text-[hsl(220,12%,98%)]">Company</h4>
                        <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Press</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 text-[hsl(220,12%,98%)]">Resources</h4>
                        <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">API</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Support</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Status</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 text-[hsl(220,12%,98%)]">Legal</h4>
                        <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Terms</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">HIPAA</a></li>
                            <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Compliance</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        <span className="text-[hsl(220,12%,98%)]">ZenLink</span>
                    </div>

                    <p className="text-[hsl(220,12%,65%)] text-sm">© 2025 ZenLink. All rights reserved.</p>

                    <div className="flex items-center gap-6">
                        <a href="#" className="text-[hsl(220,12%,65%)] hover:text-purple-400 transition-colors duration-300 hover:scale-110 transform">
                            <Facebook className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-[hsl(220,12%,65%)] hover:text-purple-400 transition-colors duration-300 hover:scale-110 transform">
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-[hsl(220,12%,65%)] hover:text-purple-400 transition-colors duration-300 hover:scale-110 transform">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-[hsl(220,12%,65%)] hover:text-purple-400 transition-colors duration-300 hover:scale-110 transform">
                            <Youtube className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
