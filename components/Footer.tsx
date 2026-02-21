'use client';

import { Mail, Github, Twitter, Linkedin, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { name: 'GitHub', icon: Github, href: 'https://github.com/Smudge049', color: 'hover:text-slate-900 dark:hover:text-white' },
        { name: 'Twitter', icon: Twitter, href: 'https://x.com/Ankit12024745', color: 'hover:text-blue-400' },
        { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/in/ankit-sapkota-a77556307/', color: 'hover:text-blue-600' },
    ];

    return (
        <footer className="w-full mt-20 pb-10 relative z-10 px-6 sm:px-24">
            <div className="max-w-7xl mx-auto">
                <div className="glass-panel rounded-[2rem] p-8 sm:p-12 overflow-hidden relative group">
                    {/* Decorative background glow */}
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Branding & Mission */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                    <span className="text-white font-black text-xl">F</span>
                                </div>
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                    FlashStudy
                                </h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
                                Empowering learners worldwide with AI-driven study tools. Transform complex information into mastery.
                            </p>
                            {/* Gemini Credit */}
                            <div className="flex items-center gap-2 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Zap className="w-3 h-3 text-primary fill-current" />
                                <span>Powered by <span className="text-primary">Google Gemini</span></span>
                            </div>
                        </div>

                        {/* Quick Links / Contact */}
                        <div className="space-y-4 md:text-right flex flex-col md:items-end">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Connect</h4>
                            <div className="flex flex-col gap-3">
                                <a
                                    href="mailto:sapkotankit49@gmail.com"
                                    className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors group/link md:justify-end"
                                >
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover/link:bg-primary/10 group-hover/link:text-primary transition-all">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span>sapkotankit49@gmail.com</span>
                                </a>
                                <div className="flex items-center gap-3 md:justify-end">
                                    {socialLinks.map((social) => (
                                        <a
                                            key={social.name}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`p-2 bg-slate-100 dark:bg-slate-800 rounded-lg transition-all ${social.color} hover:scale-110`}
                                            title={social.name}
                                        >
                                            <social.icon className="w-4 h-4" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                            © {currentYear} FlashStudy AI. All rights reserved.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <span>MADE WITH</span>
                            <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="text-red-500"
                            >
                                ❤
                            </motion.span>
                            <span>FOR GLOBAL LEARNERS</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
