import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Calendar, ShieldCheck, HelpCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { guidesData } from '../data/guidesData';

const GuideDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    
    const guide = guidesData.find(g => g.slug === slug);

    if (!guide) {
        return (
            <div className="empty-state text-center" style={{ padding: '8rem 2rem' }}>
                <h2>Guide Not Found</h2>
                <p>The resource you are looking for does not exist or has been relocated.</p>
                <Link to="/guides" className="auth-btn signup" style={{ display: 'inline-flex', marginTop: '1.5rem', textDecoration: 'none' }}>
                    Return to Guides
                </Link>
            </div>
        );
    }

    const headingSections = guide.content.filter(block => block.type === 'heading');

    return (
        <div className="guide-detail-page">
            <div className="guide-detail-header-nav">
                <Link to="/guides" className="back-btn-link">
                    <ArrowLeft size={16} />
                    Back to Guides
                </Link>
            </div>

            <div className="guide-detail-layout">
                {/* Side Navigation (Table of Contents) */}
                <aside className="guide-toc-sidebar">
                    <div className="toc-card">
                        <h4>TABLE OF CONTENTS</h4>
                        <ul>
                            {headingSections.map(head => (
                                <li key={head.id}>
                                    <a href={`#${head.id}`}>{head.text}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Main Article Content */}
                <article className="guide-article-content">
                    <div className="article-meta-badges">
                        <span className={`category-tag ${guide.category.toLowerCase()}`}>{guide.category}</span>
                        <span className="read-meta-item"><Clock size={14} /> {guide.readTime}</span>
                        <span className="read-meta-item"><Calendar size={14} /> {guide.publishDate}</span>
                    </div>

                    <h1 className="article-title">{guide.title}</h1>
                    <p className="article-excerpt">{guide.excerpt}</p>

                    <div className="article-body">
                        {guide.content.map((block, idx) => {
                            switch (block.type) {
                                case 'heading':
                                    return <h2 key={idx} id={block.id} className="article-h2">{block.text}</h2>;
                                case 'paragraph':
                                    return <p key={idx} className="article-p" dangerouslySetInnerHTML={{ __html: block.text }}></p>;
                                case 'list':
                                    return (
                                        <ul key={idx} className="article-ul">
                                            {block.items.map((item, i) => (
                                                <li key={i} dangerouslySetInnerHTML={{ __html: item }}></li>
                                            ))}
                                        </ul>
                                    );
                                case 'callout':
                                    return (
                                        <div key={idx} className={`article-callout ${block.style}`}>
                                            <div className="callout-icon-wrapper">
                                                {block.style === 'tip' ? <HelpCircle size={20} /> : <AlertTriangle size={20} />}
                                            </div>
                                            <div className="callout-text">
                                                {block.text}
                                            </div>
                                        </div>
                                    );
                                case 'table':
                                    return (
                                        <div key={idx} className="table-responsive-wrapper">
                                            <table className="article-table">
                                                <thead>
                                                    <tr>
                                                        {block.headers.map((h, i) => <th key={i}>{h}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {block.rows.map((row, i) => (
                                                        <tr key={i}>
                                                            {row.map((cell, cIdx) => (
                                                                <td key={cIdx} dangerouslySetInnerHTML={{ __html: cell }}></td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                case 'link':
                                    return (
                                        <div key={idx} className="article-cta-box">
                                            <div className="cta-content">
                                                <h4>Ready to apply this?</h4>
                                                <p>Use our secure, fast, and local tools directly in your browser.</p>
                                            </div>
                                            <Link to={block.path} className="cta-link-btn">
                                                {block.text}
                                                <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    );
                                default:
                                    return null;
                            }
                        })}
                    </div>

                    <div className="article-footer-nav">
                        <Link to="/guides" className="back-btn-link">
                            <ArrowLeft size={16} />
                            Back to Guides
                        </Link>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default GuideDetail;
