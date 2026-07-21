import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Zap, RefreshCw, FileText, Lock, BookOpen } from 'lucide-react';
import { guidesData } from '../data/guidesData';

const categoryIcons = {
    'Security': <Lock size={18} className="category-icon text-purple" />,
    'Optimization': <Zap size={18} className="category-icon text-yellow" />,
    'Formats': <RefreshCw size={18} className="category-icon text-blue" />,
    'Privacy': <Shield size={18} className="category-icon text-green" />
};

const GuidesList = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', 'Security', 'Optimization', 'Formats', 'Privacy'];

    const filteredGuides = guidesData.filter(guide => {
        const matchesCategory = selectedCategory === 'All' || guide.category === selectedCategory;
        const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              guide.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              guide.keywords.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="guides-list-container">
            <section className="guides-hero text-center">
                <div className="hero-badge"><BookOpen size={14} /> Knowledge & Resources</div>
                <h1>PDF Guides, Optimization Tips & Security Insights</h1>
                <p className="subtitle max-w-600">
                    Master your digital workflows. In-depth technical articles on document formats, data compliance, security parameters, and compression mechanics.
                </p>
            </section>

            {/* Filter and Search Bar */}
            <div className="guides-filter-row">
                <div className="category-buttons">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="search-bar-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search guides..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Grid of Articles */}
            {filteredGuides.length > 0 ? (
                <div className="guides-grid">
                    {filteredGuides.map(guide => (
                        <Link to={`/guides/${guide.slug}`} key={guide.slug} className="guide-card">
                            <div className="guide-card-header">
                                <span className={`category-tag ${guide.category.toLowerCase()}`}>
                                    {categoryIcons[guide.category]}
                                    {guide.category}
                                </span>
                                <span className="read-time">{guide.readTime}</span>
                            </div>
                            <h3>{guide.title}</h3>
                            <p className="excerpt">{guide.excerpt}</p>
                            <div className="guide-card-footer">
                                <span className="author-name">{guide.author}</span>
                                <span className="publish-date">{guide.publishDate}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="empty-state text-center">
                    <p>No guides found matching your search. Try adjusting your keywords or category.</p>
                </div>
            )}
        </div>
    );
};

export default GuidesList;
