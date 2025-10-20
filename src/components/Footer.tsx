import Link from 'next/link';
import { Play, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 mt-20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <Play className="w-8 h-8 text-blue-500" fill="currentColor" />
                            <span className="text-white text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                                Egfilm
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm">
                            Stream unlimited movies and TV shows with P2P technology. Watch together, anywhere.
                        </p>
                    </div>

                    {/* Browse */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Browse</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-blue-400 transition text-sm">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/movies" className="text-gray-400 hover:text-blue-400 transition text-sm">
                                    Movies
                                </Link>
                            </li>
                            <li>
                                <Link href="/tv" className="text-gray-400 hover:text-blue-400 transition text-sm">
                                    TV Shows
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Help</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-400 hover:text-blue-400 transition text-sm">
                                    FAQ
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-blue-400 transition text-sm">
                                    Help Center
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-blue-400 transition text-sm">
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-blue-400 transition text-sm">
                                    Privacy Policy
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Connect</h3>
                        <div className="flex gap-3">
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors"
                            >
                                <Github className="w-5 h-5 text-white" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors"
                            >
                                <Twitter className="w-5 h-5 text-white" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 bg-gray-800 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors"
                            >
                                <Mail className="w-5 h-5 text-white" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Egfilm. Built with Next.js and TMDb API.
                    </p>
                </div>
            </div>
        </footer>
    );
}
