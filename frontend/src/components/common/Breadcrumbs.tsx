import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    title: string;
    subtitle: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, title, subtitle }) => {
    return (
        <div className="bg-gradient-to-r from-[#00A1B0] to-[#008f9c] py-10">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Breadcrumb Navigation */}
                    <nav className="flex items-center gap-2 mb-5 text-white/80 text-sm">
                        {items.map((item, index) => (
                            <React.Fragment key={index}>
                                {item.path ? (
                                    <Link to={item.path} className="hover:text-white transition-colors">
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className="text-white font-medium">{item.label}</span>
                                )}
                                {index < items.length - 1 && <span>/</span>}
                            </React.Fragment>
                        ))}
                    </nav>

                    {/* Title Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
                            <p className="text-white/90 text-base">{subtitle}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Breadcrumbs;
