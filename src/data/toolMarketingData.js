import { 
    Shield, 
    Zap, 
    Smartphone, 
    Layers, 
    Crop, 
    FileText, 
    Type, 
    Lock, 
    Scissors, 
    RotateCcw, 
    Trash2, 
    Image as ImageIcon,
    Merge,
    Split,
    Layout,
    ArrowDownToLine,
    Hash,
    PenTool,
    Sparkles,
    Shapes,
    EyeOff
} from 'lucide-react';

export const toolMarketingData = {
    'watermark': {
        title: "Add PDF Watermark Online — Custom Text & Image",
        description: "No downloads needed. Add text or image watermarks to your PDF — customize content, position, angle, opacity, and size. Protect copyrights or mark document status. Completely free (the output watermark is yours to define).",
        features: [
            { icon: Type, title: "Dual watermark types", text: "Custom text (with color & bold options) or uploaded image" },
            { icon: Layout, title: "Highly customizable", text: "10 position modes (full-page tiled or 3×3 grid anchor points), angles 0°/45°/90°/180°/270°, opacity and size adjustable" },
            { icon: FileText, title: "Flexible application", text: "Apply to all pages or specify page ranges (e.g. 1-5, 8, 11-13)" },
            { icon: Layers, title: "One-click post-watermark workflows", text: "Combine with compression, merging, or format conversion — no re-uploading needed" }
        ],
        details: [
            {
                title: "Text & Image Dual Watermarks",
                text: "Enter custom text (with color and bold styling options) as a watermark, or upload a logo/image file (max 5 MB). Both modes meet different branding and protection needs.",
                icon: Type
            },
            {
                title: "10 Position Modes & Parameter Fine-Tuning",
                text: "Position 1 covers the entire page with tiled watermarks. Positions 2–10 place the watermark at any of 9 anchor points in a 3×3 grid. Angle supports 0°/45°/90°/180°/270° rotation; opacity and size freely adjustable.",
                icon: Layout
            }
        ],
        steps: [
            { title: "Upload Your PDF", text: "Click \"Choose Files\" or drag and drop your PDF into the secure workspace." },
            { title: "Design Your Watermark", text: "Choose text or image watermark. Enter content or upload an image, then adjust position, angle, opacity, and size." },
            { title: "Download Your Watermarked PDF", text: "Preview the result, then the system completes processing in seconds — download your PDF with custom watermarks." }
        ],
        faqs: [
            { question: "What watermark types are supported?", answer: "We support both text watermarks (fully customizable) and image watermarks (transparent PNGs, JPEGs, etc.)." },
            { question: "Can I adjust position and angle?", answer: "Yes, you can choose from 9 grid positions, a tiled background option, and customize the rotation angle and opacity." },
            { question: "Can I add watermarks to only some pages?", answer: "Absolutely. Our tool allows you to specify whether the watermark should appear on all pages or a specific range." },
            { question: "What are the free plan limits?", answer: "Our tool is completely free with no hidden charges or watermarks added by us. We support files up to 50MB." },
            { question: "Is watermarking safe?", answer: "Your files are processed locally or on secure servers and are deleted automatically after processing. Your data privacy is our priority." }
        ]
    },
    'compress': {
        title: "Compress PDF Online — Reduce File Size without Quality Loss",
        description: "Optimise your PDF documents for email or web use. Shrink large PDFs while maintaining high visual quality. Secure, fast, and completely free to use without any software installation.",
        features: [
            { icon: Zap, title: "Optimized Compression", text: "Advanced algorithms to reduce size while preserving resolution" },
            { icon: Shield, title: "Secure Processing", text: "Files are processed securely and deleted automatically" },
            { icon: Smartphone, title: "Works Everywhere", text: "Compress PDFs on Windows, Mac, Linux, Android, and iOS browsers" },
            { icon: Layers, title: "Batch Processing", text: "Handle multiple documents at once with our efficient tool" }
        ],
        details: [
            {
                title: "Maximum Quality, Minimum Size",
                text: "Balance fidelity and file size. Our tool selectively compresses images and removes redundant metadata to give you the smallest file possible.",
                icon: Zap
            },
            {
                title: "Privacy First",
                text: "We value your data. All files are encrypted during transit and permanently removed from our servers within an hour of processing.",
                icon: Shield
            }
        ],
        steps: [
            { title: "Select PDF Files", text: "Choose the large PDF documents you want to compress from your device." },
            { title: "Choose Level", text: "Select your preferred compression level: extreme, recommended, or low compression." },
            { title: "Download Result", text: "Wait a few seconds for the compression to finish and download your optimized PDF." }
        ],
        faqs: [
            { question: "Will my PDF lose quality?", answer: "We use smart compression that targets images and metadata. Text and vector graphics remain sharp." },
            { question: "Is there a file size limit?", answer: "We support files up to 100MB for compression. For larger files, consider splitting them first." },
            { question: "Can I compress multiple files?", answer: "Yes, you can upload and compress multiple PDFs simultaneously to save time." }
        ]
    },
    'merge': {
        title: "Merge PDF Files Online — Combine Documents in Seconds",
        description: "Combine multiple PDF files into a single document effortlessly. Reorder pages, remove unnecessary parts, and create a professional combined file for free. No installation required.",
        features: [
            { icon: Merge, title: "Simple Drag-and-Drop", text: "Easily arrange your files in the exact order you want them merged" },
            { icon: Layout, title: "Visual Reordering", text: "See thumbnail previews of your files to ensure the perfect sequence" },
            { icon: Shield, title: "100% Private", text: "Your files are protected with SSL encryption and never stored permanently" },
            { icon: Smartphone, title: "Device Independent", text: "Merge PDFs on your phone, tablet, or desktop with ease" }
        ],
        details: [
            {
                title: "Effortless Document Management",
                text: "Stop juggling dozens of files. Merge reports, invoices, and certificates into one unified PDF document ready for sharing.",
                icon: Merge
            },
            {
                title: "Flexible Ordering",
                text: "Upload your files and just drag them into place. You can even add more files after the initial upload.",
                icon: Layout
            }
        ],
        steps: [
            { title: "Upload PDFs", text: "Select all the PDF files you want to combine into one." },
            { title: "Arrange Order", text: "Drag and drop the files to set the correct sequence for your new document." },
            { title: "Merge & Save", text: "Click the merge button and download your newly created single PDF file." }
        ],
        faqs: [
            { question: "How many files can I merge at once?", answer: "You can merge up to 25 files in a single operation for free." },
            { question: "Can I merge protected PDFs?", answer: "You'll need to unlock password-protected PDFs before they can be merged." },
            { question: "Does merging change the content?", answer: "No, the content of your original pages remains exactly the same; they are just combined." }
        ]
    },
    'splitter': {
        title: "Split PDF Online — Extract Pages into Separate Files",
        description: "Break a large PDF into smaller parts. Extract specific page ranges or save every page as an individual PDF. Fast, secure, and preserves original document quality.",
        features: [
            { icon: Split, title: "Various Split Modes", text: "Extract unique ranges, fixed intervals, or split every page" },
            { icon: Scissors, title: "Precise Extraction", text: "Select exactly the pages you need with our intuitive page selector" },
            { icon: Zap, title: "Lightning Fast", text: "High-speed processing ensures your files are ready in an instant" },
            { icon: Shield, title: "Secure & Anonymous", text: "No accounts needed. Your files are yours alone and deleted after use" }
        ],
        details: [
            {
                title: "Extract What Matters",
                text: "Don't send whole books when you only need a chapter. Select ranges (like 1-5, 10-12) and get exactly what you need.",
                icon: Scissors
            },
            {
                title: "Every Page Counts",
                text: "Need each page as a separate file? Use our 'Split all pages' feature to automate the process in one click.",
                icon: Split
            }
        ],
        steps: [
            { title: "Select Document", text: "Upload the PDF file you wish to split into multiple sections." },
            { title: "Set Split Rules", text: "Define the page ranges or individual pages you want to extract." },
            { title: "Download Parts", text: "Process and download your split files as a convenient ZIP archive or individual files." }
        ],
        faqs: [
            { question: "Can I split a PDF into specific ranges?", answer: "Yes, you can define multiple ranges like '1-4' and '7-10' simultaneously." },
            { question: "Will my split files have the same quality?", answer: "Yes, splitting is a structural change; the actual page content is never re-rendered or degraded." },
            { question: "Is there a limit on pages?", answer: "Our tool can handle PDFs with hundreds of pages without any issues." }
        ]
    },
    'organize': {
        title: "Organize PDF Online — Reorder, Rotate, and Remove Pages",
        description: "Gain total control over your PDF structure. Move pages around, delete unnecessary ones, and fix orientation issues in one powerful visual editor.",
        features: [
            { icon: Layout, title: "Visual Thumbnail Grid", text: "See every page of your PDF at a glance for easy organization" },
            { icon: RotateCcw, title: "Quick Rotation", text: "Fix upside-down or sideways pages with a single click" },
            { icon: Trash2, title: "One-Click Removal", text: "Instantly delete pages you no longer need in your document" },
            { icon: Smartphone, title: "Touch Friendly", text: "Optimized for mobile browsers with easy drag-and-drop support" }
        ],
        details: [
            {
                title: "Full Structural Control",
                text: "Rearrange your document exactly how you want it. It's like having a physical stack of papers that you can shuffle and sort perfectly.",
                icon: Layout
            },
            {
                title: "Clean Up Your Docs",
                text: "Remove blank pages, outdated sections, or irrelevant information before sending your PDF to clients or colleagues.",
                icon: Trash2
            }
        ],
        steps: [
            { title: "Upload PDF", text: "Open the PDF document you want to organize in our visual workspace." },
            { title: "Edit Layout", text: "Drag to reorder, click to rotate, or hit the trash icon to remove specific pages." },
            { title: "Save Changes", text: "Review your new layout and download the perfectly organized PDF file." }
        ],
        faqs: [
            { question: "Can I undo a page deletion?", answer: "As long as you haven't clicked 'Download', you can always reset or adjust your changes." },
            { question: "How many pages can I organize?", answer: "Our visual editor smoothly handles documents up to 200 pages." },
            { question: "Does it work with large files?", answer: "Yes, we optimize thumbnails so you can organize large files without slowing down your browser." }
        ]
    },
    'extract': {
        title: "Extract PDF Pages — Save Specific Parts as New Files",
        description: "Quickly pick and choose pages from any PDF. Whether it's a single page or a scattered collection, extract them into a brand new, clean PDF document.",
        features: [
            { icon: Scissors, title: "Selective Extraction", text: "Pick individual pages or custom ranges with ease" },
            { icon: FileText, title: "Instant New PDF", text: "Create a fresh document containing only the pages you selected" },
            { icon: Zap, title: "No Latency", text: "Real-time page picking and instantaneous processing" },
            { icon: Lock, title: "Enterprise Security", text: "Professional-grade encryption ensures your data stays safe" }
        ],
        details: [
            {
                title: "Custom Content Creation",
                text: "Curate exactly what you want. Extract key findings from a report or specific slides from a presentation into a compact new file.",
                icon: FileText
            },
            {
                title: "Smart Range Selection",
                text: "Manually click pages or type in ranges. Our smart selector handles complex requests like '1, 3, 5-10, 15'.",
                icon: Scissors
            }
        ],
        steps: [
            { title: "Open PDF", text: "Upload the document from which you need to extract specific pages." },
            { title: "Select Pages", text: "Click on the thumbnails of the pages you want to keep in your new file." },
            { title: "Extract & Download", text: "Click the extract button to create and download your custom PDF." }
        ],
        faqs: [
            { question: "Can I extract pages from multiple PDFs?", answer: "Currently, you extract from one file at a time. To combine parts of different files, use the Merge tool afterward." },
            { question: "What if my PDF is password protected?", answer: "You'll need to provide the password or unlock the file first to view and extract pages." },
            { question: "Is page extraction free?", answer: "Yes, like all our tools, page extraction is 100% free with no limits." }
        ]
    },
    'remover': {
        title: "Remove PDF Pages — Clean Up Your Documents Online",
        description: "Strip away unnecessary pages from your PDF files. Eliminate blank pages, unwanted cover sheets, or sensitive information in seconds.",
        features: [
            { icon: Trash2, title: "Visual Deletion", text: "Identify and remove pages using high-quality thumbnail previews" },
            { icon: Zap, title: "Fast Cleanup", text: "Process documents instantly and download the cleaned version" },
            { icon: Smartphone, title: "Web Based", text: "Works straight in your browser—no app or plug-in required" },
            { icon: Shield, title: "Deleted Permanently", text: "Files are wiped from our servers immediately after you finish" }
        ],
        details: [
            {
                title: "Simplify Your PDFs",
                text: "Don't let clutter hide your message. Remove redundant pages and make your documents easier to read and more professional.",
                icon: Trash2
            },
            {
                title: "Batch Removal",
                text: "Select multiple pages at once to delete whole sections of a document with minimal effort.",
                icon: Scissors
            }
        ],
        steps: [
            { title: "Upload File", text: "Choose the PDF file that contains pages you want to delete." },
            { title: "Mark for Removal", text: "Click the 'X' or trash icon on every page you want to get rid of." },
            { title: "Finalize & Save", text: "Process your request and download the updated PDF file without the unwanted pages." }
        ],
        faqs: [
            { question: "Can I delete a range of pages?", answer: "Yes, you can manually select a range of pages to delete them all at once." },
            { question: "Does this affect the remaining pages?", answer: "No, the tool only removes the structural links to the deleted pages; the rest of the document is untouched." },
            { question: "Is there a limit to how many pages I can remove?", answer: "No, you can remove as many pages as you like, as long as at least one page remains in the document." }
        ]
    },
    'rotate': {
        title: "Rotate PDF Pages — Fix Orientation of Your PDF Documents",
        description: "Fix scans that came out sideways or upside down. Rotate individual pages or the entire document to the correct orientation in clicks.",
        features: [
            { icon: RotateCcw, title: "360° Rotation", text: "Rotate pages 90, 180, or 270 degrees till they look right" },
            { icon: Layout, title: "Individual Page Fix", text: "Only rotate the specific pages that are misaligned" },
            { icon: Zap, title: "Instant Preview", text: "See the changes happening in real-time as you click rotate" },
            { icon: Smartphone, title: "Cross-Platform", text: "Works on desktop, tablet, and mobile with no performance hit" }
        ],
        details: [
            {
                title: "Professional Presentation",
                text: "Ensure your documents are always right-side up. Perfect for certificates, architectural plans, or scanned receipts.",
                icon: RotateCcw
            },
            {
                title: "Bulk Rotation",
                text: "Rotate all pages in a document at once to save time when the entire scan was done in the wrong orientation.",
                icon: Layout
            }
        ],
        steps: [
            { title: "Upload PDF", text: "Select the PDF file that has orientation issues." },
            { title: "Adjust Rotation", text: "Click the rotate icon on individual thumbnails or use the ‘Rotate All’ button." },
            { title: "Download Fixed PDF", text: "Save your corrected document once all pages are perfectly aligned." }
        ],
        faqs: [
            { question: "Can I rotate just one page?", answer: "Yes, every page thumbnail has its own rotation controls for precise editing." },
            { question: "Does rotation lose image quality?", answer: "No, rotation is a metadata change in the PDF structure; image pixels are not re-sampled." },
            { question: "Is it permanent?", answer: "Once you download the file, the new orientation is saved permanently within the PDF." }
        ]
    },
    'protect': {
        title: "Protect PDF Online — Add Password and Encryption",
        description: "Secure your sensitive documents with industry-standard encryption. Add a strong password to prevent unauthorized viewing or editing.",
        features: [
            { icon: Lock, title: "AES-256 Encryption", text: "Military-grade encryption to keep your data safe from prying eyes" },
            { icon: Shield, title: "User & Owner Passwords", text: "Control who can open, print, or copy content from your PDF" },
            { icon: Zap, title: "Instant Locking", text: "Apply security features in milliseconds without complex software" },
            { icon: Smartphone, title: "Safe Anywhere", text: "Protect your files on the go using any modern web browser" }
        ],
        details: [
            {
                title: "Maximum Data Privacy",
                text: "Add a layer of security to financial statements, legal contracts, or personal records before sharing them over email or cloud storage.",
                icon: Lock
            },
            {
                title: "Simple & Effective",
                text: "No need for expensive Acrobat licenses. Our free tool provides professional-grade security that works with all standard PDF readers.",
                icon: Shield
            }
        ],
        steps: [
            { title: "Select PDF", text: "Upload the document you wish to lock with a password." },
            { title: "Set Password", text: "Type in a strong password and choose your encryption level." },
            { title: "Encrypt & Save", text: "Download your newly protected file. Remember your password—we can't recover it!" }
        ],
        faqs: [
            { question: "How strong is the encryption?", answer: "We use high-bit AES encryption, which is standard for securing digital documents globally." },
            { question: "Does this prevent printing?", answer: "Yes, you can set permissions that restrict printing, copying, and editing." },
            { question: "What happens if I forget my password?", answer: "For security reasons, we do not store your passwords. If you lose it, the file cannot be opened." }
        ]
    },
    'redact': {
        title: "Redact PDF Online — Permanently Hide Sensitive Information",
        description: "Black out text and images to remove private data from your documents. Unlike simple black boxes, our tool securely removes the underlying data.",
        features: [
            { icon: EyeOff, title: "Secure Redaction", text: "True data removal, not just visual masking. Information is gone forever" },
            { icon: Scissors, title: "Precision Highlighting", text: "Draw boxes over exactly what you want to hide: names, IDs, or numbers" },
            { icon: Zap, title: "Fast Obfuscation", text: "Process large documents with multiple redactions in seconds" },
            { icon: Lock, title: "Compliance Ready", text: "Meet GDPR and HIPAA privacy standards by properly sanitizing documents" }
        ],
        details: [
            {
                title: "Safe Information Sharing",
                text: "Redact Social Security numbers, addresses, and private contact info before making documents public or sharing with third parties.",
                icon: EyeOff
            },
            {
                title: "Irreversible Process",
                text: "Our tool ensures that redacted information cannot be recovered by searching or selecting text in the final PDF.",
                icon: Shield
            }
        ],
        steps: [
            { title: "Upload Document", text: "Choose the PDF file that contains sensitive information." },
            { title: "Mark Areas", text: "Drag your cursor to draw black boxes over the text or images you want to hide." },
            { title: "Redact & Download", text: "Apply the redactions and download a clean, secure version of your document." }
        ],
        faqs: [
            { question: "Is redaction different from drawing a box?", answer: "Yes! Simply drawing a box leaves the text underneath searchable. Our tool deletes the underlying data." },
            { question: "Can I redact images?", answer: "Absolutely. You can draw redaction boxes over any part of the page, including photos and logos." },
            { question: "Is my original file safe?", answer: "Your original stays on your computer. We provide a new, modified version for download." }
        ]
    },
    'img2pdf': {
        title: "Image to PDF Converter — Turn Photos into PDF Documents",
        description: "Convert JPG, PNG, BMP, and GIF images into high-quality PDFs. Create a single PDF from multiple images or one per page. Perfect for scanning documents with your phone.",
        features: [
            { icon: ImageIcon, title: "Universal Formats", text: "Full support for JPG, PNG, WebP, and more" },
            { icon: Layout, title: "Layout Optimization", text: "Adjust page size, orientation, and margins for a professional look" },
            { icon: Merge, title: "Combine Images", text: "Merge dozens of photos into a single, organized PDF file" },
            { icon: Zap, title: "No Compression Blur", text: "Keep your images sharp and clear in the resulting PDF" }
        ],
        details: [
            {
                title: "Digitize Your Paperwork",
                text: "Take photos of receipts, homework, or IDs and turn them into a clean PDF ready for submission or archiving.",
                icon: ImageIcon
            },
            {
                title: "Portfolio Creation",
                text: "Combine your designs or photography into a single PDF portfolio that looks professional on any device.",
                icon: Layout
            }
        ],
        steps: [
            { title: "Upload Images", text: "Select all the image files you want to convert from your gallery or folder." },
            { title: "Configure Layout", text: "Arrange images in order and choose page orientation (Portrait or Landscape)." },
            { title: "Convert & Save", text: "Merge the images into a single PDF or download them individually." }
        ],
        faqs: [
            { question: "What image types work best?", answer: "JPG and PNG provide the best results, but we support most standard web formats." },
            { question: "Can I rearrange images after uploading?", answer: "Yes, you can drag and drop the thumbnails to change the page order before converting." },
            { question: "Is there a limit on how many images?", answer: "You can convert up to 50 images in one go for free." }
        ]
    },
    'pdf2jpg': {
        title: "PDF to JPG Converter — Extract Images or Flatten Pages",
        description: "Convert PDF pages into high-resolution JPG images. Perfect for sharing pages on social media or using document content in image editors.",
        features: [
            { icon: ImageIcon, title: "High-Res Extraction", text: "Export every page as a sharp, high-quality image file" },
            { icon: Zap, title: "Bulk Conversion", text: "Turn a 50-page PDF into a collection of images in seconds" },
            { icon: Smartphone, title: "No App Needed", text: "Convert documents directly from your mobile browser anywhere" },
            { icon: ArrowDownToLine, title: "ZIP Download", text: "Get all your converted images in one convenient, compressed archive" }
        ],
        details: [
            {
                title: "Portability & Compatibility",
                text: "JPGs are viewable on every device without a PDF reader. Perfect for embedding document pages into websites or presentations.",
                icon: Zap
            },
            {
                title: "Crystal Clear Quality",
                text: "Our converter preserves text clarity and image detail so your output looks as good as the original PDF.",
                icon: ImageIcon
            }
        ],
        steps: [
            { title: "Upload PDF", text: "Choose the document you want to convert into images." },
            { title: "Select Mode", text: "Choose between 'Entire Pages' or 'Extract Images' (if available)." },
            { title: "Download Images", text: "Wait for the process to finish and download your JPGs as a ZIP file." }
        ],
        faqs: [
            { question: "Does it convert every page?", answer: "Yes, each page of your PDF becomes a separate JPG image." },
            { question: "What is the image resolution?", answer: "We use a high DPI setting typically resulting in 150-300 DPI for sharp text." },
            { question: "Is it safe for private files?", answer: "Absolutely. All processing is secure, and files are deleted automatically." }
        ]
    },
    'crop': {
        title: "Crop PDF Online — Trim Margins and Adjust Page Size",
        description: "Remove unwanted white space or focus on a specific area of your PDF pages. Precise cropping for better readability on small screens.",
        features: [
            { icon: Crop, title: "Visual Cropping", text: "Use our interactive tool to select exactly the area you want to keep" },
            { icon: Layout, title: "Apply to All", text: "Crop the entire document consistently or page by page" },
            { icon: Zap, title: "Instant Preview", text: "See exactly what your cropped document will look like before processing" },
            { icon: Shield, title: "Secure Workflow", text: "Professional processing that keeps your data confidential" }
        ],
        details: [
            {
                title: "Optimize for Mobile",
                text: "Remove large margins from academic papers or reports to make the text larger and easier to read on e-readers and phones.",
                icon: Smartphone
            },
            {
                title: "Professional Formatting",
                text: "Trim off scan artifacts or printer marks to give your documents a clean, professional finish.",
                icon: Crop
            }
        ],
        steps: [
            { title: "Upload PDF", text: "Choose the document you want to crop or resize." },
            { title: "Select Area", text: "Draw a box over the part of the page you want to keep." },
            { title: "Crop & Download", text: "Apply the crop and save your newly formatted PDF file." }
        ],
        faqs: [
            { question: "Can I crop all pages at once?", answer: "Yes, you can choose to apply the same crop parameters to every page in the document." },
            { question: "Does cropping reduce file size?", answer: "It can slightly reduce size, though its main purpose is visual layout adjustment." },
            { question: "Can I undo a crop?", answer: "You can adjust the crop box as much as you like before clicking the final 'Crop' button." }
        ]
    },
    'numberer': {
        title: "Add Page Numbers to PDF — Organize Your Documents",
        description: "Add professional page numbering to your PDF files. Customize position, font, size, and starting number with ease.",
        features: [
            { icon: Hash, title: "Custom Positioning", text: "Place numbers at the top, bottom, left, right, or center of the page" },
            { icon: Type, title: "Font & Style", text: "Choose fonts and colors that match your document's branding" },
            { icon: Layout, title: "Range Control", text: "Start numbering from any page or exclude the cover page" },
            { icon: Zap, title: "Fast Application", text: "Process hundreds of pages in a blink of an eye" }
        ],
        details: [
            {
                title: "Better Navigation",
                text: "Make long documents easier to read and reference with clear, consistent page numbering throughout.",
                icon: Hash
            },
            {
                title: "Fine-Grained Setup",
                text: "Skip the first page, start from number 5, or use 'Page X of Y' formats to meet any professional requirement.",
                icon: FileText
            }
        ],
        steps: [
            { title: "Select PDF", text: "Upload the document you want to add page numbers to." },
            { title: "Customize", text: "Choose where the numbers should appear and select your preferred font and style." },
            { title: "Download", text: "Click the add button and download your newly numbered PDF document." }
        ],
        faqs: [
            { question: "Where can I place the numbers?", answer: "We support 6 standard positions: Top Left, Center, Right, and Bottom Left, Center, Right." },
            { question: "Can I skip the first page?", answer: "Yes, you can specify which page the numbering should start on." },
            { question: "Is it free for large PDFs?", answer: "Yes, you can add numbers to PDFs of any length for zero cost." }
        ]
    },
    'remover_tool': {
        title: "Smart Watermark Remover — Clean Your PDFs Professionally",
        description: "Remove unwanted text and image watermarks from your PDF documents. Our smart tool identifies recurring elements and cleans them without damaging your content.",
        features: [
            { icon: Sparkles, title: "Smart Identification", text: "Automatically detect and target recurring watermark patterns" },
            { icon: EyeOff, title: "Clean Results", text: "Leave your document looking original and artifact-free" },
            { icon: Shield, title: "Safe & Secure", text: "All processing is private. We never share your cleaned documents" },
            { icon: Zap, title: "Instant Cleanup", text: "Save hours of manual editing with our specialized removal algorithms" }
        ],
        details: [
            {
                title: "Restore Document Clarity",
                text: "Remove 'Draft', 'Sample', or old branding to make your documents professional again for presentation or redistribution.",
                icon: Sparkles
            },
            {
                title: "Deep Stream Analysis",
                text: "Our tool goes beyond simply covering watermarks; it attempts to excise them from the PDF's internal structure for the cleanest possible result.",
                icon: Scissors
            }
        ],
        steps: [
            { title: "Upload PDF", text: "Select the PDF file that contains the watermarks you want to remove." },
            { title: "Select Watermark", text: "Identify the text or image pattern that represents the watermark." },
            { title: "Remove & Save", text: "Process the document and download the clean, watermark-free version." }
        ],
        faqs: [
            { question: "Does it work on every watermark?", answer: "It works best on structural watermarks. Scanned-in 'baked' watermarks might require different techniques." },
            { question: "Will my text remain editable?", answer: "In most cases, yes. We aim to only remove the watermark layers while leaving text content intact." },
            { question: "Is there a file limit?", answer: "We support files up to 50MB for advanced watermark removal." }
        ]
    },
    'editor': {
        title: "All-in-One PDF Editor — Edit Text, Images, and Shapes",
        description: "Full-featured PDF editing right in your browser. Modify text, add annotations, insert images, and sign documents without any subscription.",
        features: [
            { icon: PenTool, title: "Text Editing", text: "Add, modify, or delete text directly on the PDF page" },
            { icon: ImageIcon, title: "Image Insertion", text: "Place logos, photos, or diagrams exactly where you need them" },
            { icon: Lock, title: "Secure Signing", text: "Add your personal signature to contracts and forms with ease" },
            { icon: Shapes, title: "Drawing Tools", text: "Annotate with lines, shapes, and highlights for better communication" }
        ],
        details: [
            {
                title: "Complete Creative control",
                text: "Stop converting back and forth to Word. Edit your PDF directly and save time on every document task.",
                icon: PenTool
            },
            {
                title: "Professional Markup",
                text: "Perfect for reviewing documents. Add comments, highlight key sections, and collaborate effectively without extra software.",
                icon: FileText
            }
        ],
        steps: [
            { title: "Load Document", text: "Upload the PDF file you want to edit." },
            { title: "Modify Content", text: "Use our toolbar to add text, insert images, or draw on the page." },
            { title: "Save & Export", text: "Download your edited PDF once you've finished your changes." }
        ],
        faqs: [
            { question: "Can I change existing text?", answer: "Yes, our editor allows you to type over or modify existing text in many PDF documents." },
            { question: "Does it support signatures?", answer: "Yes, you can draw your signature or upload an image of it to sign any page." },
            { question: "Is my edited file secure?", answer: "Absolutely. We use SSL encryption and delete files shortly after you finish editing." }
        ]
    }
};
