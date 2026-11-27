'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  apiFetch,
  AboutGalleryItem,
  AboutSectionItem,
  AboutPageData
} from '@/lib/api';
import { DynamicIcon, AVAILABLE_ICON_NAMES } from '@/components/IconResolver';
import {
  Info,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  Check,
  X,
  Search,
  Sparkles,
  Layers,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Tag,
  ArrowRight,
  UploadCloud
} from 'lucide-react';

export default function AdminAboutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'GALLERY' | 'SECTIONS'>('GALLERY');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'STAT' | 'MISSION' | 'VISION' | 'VALUE' | 'STEP'>('ALL');

  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<AboutGalleryItem[]>([]);
  const [sections, setSections] = useState<AboutSectionItem[]>([]);

  // Gallery Modal
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<AboutGalleryItem | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Culture');
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoImageUrl, setPhotoImageUrl] = useState('');
  const [photoImageFile, setPhotoImageFile] = useState<File | null>(null);
  const [photoImagePreview, setPhotoImagePreview] = useState<string | null>(null);
  const [photoOrder, setPhotoOrder] = useState<number>(1);
  const [photoActive, setPhotoActive] = useState<boolean>(true);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);

  // Gallery Preview Lightbox Modal (To preview "View Contents")
  const [previewGalleryItem, setPreviewGalleryItem] = useState<AboutGalleryItem | null>(null);

  // Section Item Modal
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<AboutSectionItem | null>(null);
  const [sectionType, setSectionType] = useState<'STAT' | 'MISSION' | 'VISION' | 'VALUE' | 'STEP'>('VALUE');
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionSubtitle, setSectionSubtitle] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');
  const [sectionIcon, setSectionIcon] = useState('Sparkles');
  const [sectionOrder, setSectionOrder] = useState<number>(1);
  const [sectionActive, setSectionActive] = useState<boolean>(true);
  const [iconSearch, setIconSearch] = useState('');
  const [sectionSubmitting, setSectionSubmitting] = useState(false);

  // Custom Icon Photo States
  const [iconMode, setIconMode] = useState<'preset' | 'custom'>('preset');
  const [customIconFile, setCustomIconFile] = useState<File | null>(null);
  const [customIconPreview, setCustomIconPreview] = useState<string | null>(null);
  const [customIconUrl, setCustomIconUrl] = useState('');

  // Delete Confirm
  const [deletePhoto, setDeletePhoto] = useState<AboutGalleryItem | null>(null);
  const [deleteSection, setDeleteSection] = useState<AboutSectionItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Auth protection
  useEffect(() => {
    if (!authLoading && (!user || (!user.is_staff && !user.is_superuser))) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  // Fetch full data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<AboutPageData>('/about/');
      setGallery(res.gallery || []);
      const allSecs = [
        ...(res.stats || []),
        ...(res.mission ? [res.mission] : []),
        ...(res.vision ? [res.vision] : []),
        ...(res.values || []),
        ...(res.steps || []),
      ];
      setSections(allSecs);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load About page data', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.is_staff || user.is_superuser)) {
      fetchData();
    }
  }, [user]);

  // Bulletproof lock of background scroll when any modal or "View Contents" preview is open
  const isAnyModalOpen =
    galleryModalOpen ||
    sectionModalOpen ||
    Boolean(previewGalleryItem) ||
    Boolean(deletePhoto) ||
    Boolean(deleteSection);

  useEffect(() => {
    if (!isAnyModalOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar disappearance so layout doesn't shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');

    // Intercept wheel events outside scrollable areas or at scroll bounds
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest('.modal-scrollable') as HTMLElement | null;
      if (!scrollable) {
        e.preventDefault();
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest('.modal-scrollable');
      if (!scrollable) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isAnyModalOpen]);

  // --- GALLERY HANDLERS ---
  const handleOpenCreatePhoto = () => {
    setEditingPhoto(null);
    setPhotoTitle('');
    setPhotoCaption('');
    setPhotoCategory('Culture');
    setPhotoDescription('');
    setPhotoImageUrl('');
    setPhotoImageFile(null);
    setPhotoImagePreview(null);
    setPhotoOrder(gallery.length + 1);
    setPhotoActive(true);
    setGalleryModalOpen(true);
  };

  const handleOpenEditPhoto = (item: AboutGalleryItem) => {
    setEditingPhoto(item);
    setPhotoTitle(item.title);
    setPhotoCaption(item.caption || '');
    setPhotoCategory(item.category || 'Culture');
    setPhotoDescription(item.description || '');
    setPhotoImageUrl(item.image_url || '');
    setPhotoImageFile(null);
    setPhotoImagePreview(item.effective_image || null);
    setPhotoOrder(item.display_order);
    setPhotoActive(item.is_active);
    setGalleryModalOpen(true);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoImageFile(file);
      setPhotoImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoTitle.trim()) {
      toast.error('Photo title is required', 'Validation Error');
      return;
    }

    try {
      setPhotoSubmitting(true);
      if (photoImageFile) {
        const fd = new FormData();
        fd.append('title', photoTitle.trim());
        fd.append('caption', photoCaption.trim());
        fd.append('category', photoCategory.trim());
        fd.append('description', photoDescription.trim());
        fd.append('image', photoImageFile);
        if (photoImageUrl.trim()) fd.append('image_url', photoImageUrl.trim());
        fd.append('display_order', photoOrder.toString());
        fd.append('is_active', String(photoActive));

        if (editingPhoto) {
          await apiFetch(`/about/gallery/${editingPhoto.id}/`, {
            method: 'PATCH',
            body: fd,
          });
          toast.success('Photo updated successfully!', 'Gallery Updated');
        } else {
          await apiFetch('/about/gallery/', {
            method: 'POST',
            body: fd,
          });
          toast.success('New showcase photo added!', 'Gallery Item Created');
        }
      } else {
        const payload: Record<string, any> = {
          title: photoTitle.trim(),
          caption: photoCaption.trim(),
          category: photoCategory.trim(),
          description: photoDescription.trim(),
          image_url: photoImageUrl.trim(),
          display_order: photoOrder,
          is_active: photoActive,
        };

        if (editingPhoto) {
          await apiFetch(`/about/gallery/${editingPhoto.id}/`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          });
          toast.success('Photo updated successfully!', 'Gallery Updated');
        } else {
          await apiFetch('/about/gallery/', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          toast.success('New showcase photo added!', 'Gallery Item Created');
        }
      }

      setGalleryModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save photo', 'Save Error');
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handleDeletePhotoConfirm = async () => {
    if (!deletePhoto) return;
    try {
      setDeleting(true);
      await apiFetch(`/about/gallery/${deletePhoto.id}/`, { method: 'DELETE' });
      toast.success('Photo deleted from gallery', 'Removed');
      setGallery((prev) => prev.filter((p) => p.id !== deletePhoto.id));
      setDeletePhoto(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete photo', 'Error');
    } finally {
      setDeleting(false);
    }
  };

  // --- SECTION ITEM HANDLERS ---
  const handleOpenEditSection = (item: AboutSectionItem) => {
    setEditingSection(item);
    setSectionType(item.section_type);
    setSectionTitle(item.title);
    setSectionSubtitle(item.subtitle_or_value || '');
    setSectionDesc(item.description || '');
    setSectionIcon(item.icon || 'Sparkles');
    setSectionOrder(item.display_order);
    setSectionActive(item.is_active);
    setIconSearch('');

    const effectiveCustom = item.effective_custom_icon || item.custom_icon_url || null;
    if (effectiveCustom) {
      setIconMode('custom');
      setCustomIconPreview(effectiveCustom);
      setCustomIconUrl(item.custom_icon_url || '');
    } else {
      setIconMode('preset');
      setCustomIconPreview(null);
      setCustomIconUrl('');
    }
    setCustomIconFile(null);
    setSectionModalOpen(true);
  };

  const handleOpenCreateSection = (defaultType: 'STAT' | 'VALUE' = 'VALUE') => {
    setEditingSection(null);
    setSectionType(defaultType);
    setSectionTitle('');
    setSectionSubtitle(defaultType === 'STAT' ? '1,000+' : 'New Badge');
    setSectionDesc('');
    setSectionIcon('Sparkles');
    setSectionOrder(sections.filter((s) => s.section_type === defaultType).length + 1);
    setSectionActive(true);
    setIconSearch('');
    setIconMode('preset');
    setCustomIconFile(null);
    setCustomIconPreview(null);
    setCustomIconUrl('');
    setSectionModalOpen(true);
  };

  const handleCustomIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomIconFile(file);
      setCustomIconPreview(URL.createObjectURL(file));
      setIconMode('custom');
    }
  };

  const handleRemoveCustomIcon = () => {
    setCustomIconFile(null);
    setCustomIconPreview(null);
    setCustomIconUrl('');
    setIconMode('preset');
  };

  const handleSubmitSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim()) {
      toast.error('Title is required', 'Validation Error');
      return;
    }

    try {
      setSectionSubmitting(true);
      const fd = new FormData();
      fd.append('section_type', sectionType);
      fd.append('title', sectionTitle.trim());
      fd.append('subtitle_or_value', sectionSubtitle.trim());
      fd.append('description', sectionDesc.trim());
      fd.append('icon', sectionIcon);
      fd.append('display_order', sectionOrder.toString());
      fd.append('is_active', String(sectionActive));

      if (iconMode === 'custom') {
        if (customIconFile) {
          fd.append('custom_icon', customIconFile);
        }
        if (customIconUrl.trim()) {
          fd.append('custom_icon_url', customIconUrl.trim());
        }
      } else {
        // Clearing custom photo if user switched back to preset Lucide icon
        fd.append('custom_icon', '');
        fd.append('custom_icon_url', '');
      }

      const url = editingSection ? `/about/sections/${editingSection.id}/` : '/about/sections/';
      const method = editingSection ? 'PATCH' : 'POST';

      await apiFetch(url, {
        method,
        body: fd,
      });

      toast.success(
        editingSection ? `Updated "${sectionTitle}" successfully!` : `Created "${sectionTitle}" successfully!`,
        'Section Saved'
      );

      setSectionModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save section item', 'Save Error');
    } finally {
      setSectionSubmitting(false);
    }
  };

  const handleDeleteSectionConfirm = async () => {
    if (!deleteSection) return;
    try {
      setDeleting(true);
      await apiFetch(`/about/sections/${deleteSection.id}/`, { method: 'DELETE' });
      toast.success('Section item deleted', 'Removed');
      setSections((prev) => prev.filter((s) => s.id !== deleteSection.id));
      setDeleteSection(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete section item', 'Error');
    } finally {
      setDeleting(false);
    }
  };

  // Restore baseline
  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all about sections and default gallery items back to default?')) return;
    try {
      await apiFetch('/about/reset_defaults/', { method: 'POST' });
      toast.success('Default About Us content restored!', 'Reset Complete');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore default content', 'Error');
    }
  };

  const filteredIcons = AVAILABLE_ICON_NAMES.filter((name) =>
    name.toLowerCase().includes(iconSearch.toLowerCase().trim())
  );

  const filteredSections = sections.filter((s) => {
    if (sectionFilter === 'ALL') return true;
    return s.section_type === sectionFilter;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
      {/* 1. HEADER SECTION */}
      <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 dark:from-black dark:via-black dark:to-black border border-sky-100/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
              <Info className="w-3.5 h-3.5" />
              About Us CMS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2">
            About Us Content & Gallery Manager
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Manage showcase photos with full view contents, edit stats, update mission/vision statements, and customize icons directly from the admin panel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/about"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>View Public About Page</span>
          </Link>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Restore default Jagir AI content"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('GALLERY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'GALLERY'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Showcase Photos & View Contents ({gallery.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SECTIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'SECTIONS'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Manage Icons, Stats & Values ({sections.length})</span>
        </button>
      </div>

      {/* 3. TAB CONTENT: GALLERY PHOTOS */}
      {activeTab === 'GALLERY' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Showcase Photos Gallery
              </h2>
              <p className="text-xs text-slate-500">
                Photos are displayed on the public About Us page with an interactive &ldquo;View Contents&rdquo; button.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreatePhoto}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Photo</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading gallery photos...</p>
            </div>
          ) : gallery.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No showcase photos uploaded yet</p>
              <button
                type="button"
                onClick={handleOpenCreatePhoto}
                className="mt-3 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
              >
                Add Your First Photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between group hover:border-sky-300 dark:hover:border-slate-700 transition"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                      {item.effective_image ? (
                        <img
                          src={item.effective_image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-10 h-10" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/20">
                        {item.category}
                      </span>
                      {!item.is_active && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                          Hidden
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">
                        {item.title}
                      </h3>
                      {item.caption && (
                        <p className="text-xs font-medium text-sky-600 dark:text-sky-400 line-clamp-1">
                          {item.caption}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description || 'No detailed story contents provided yet.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-850/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewGalleryItem(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-sky-600 transition cursor-pointer"
                      title="Preview how View Contents looks"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      <span>View Contents</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPhoto(item)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Edit Photo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePhoto(item)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition cursor-pointer"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: SECTIONS & ICONS */}
      {activeTab === 'SECTIONS' && (
        <div className="space-y-6">
          {/* Sub-Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Section:
              </span>
              {(['ALL', 'STAT', 'MISSION', 'VISION', 'VALUE', 'STEP'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSectionFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    sectionFilter === st
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {st === 'ALL'
                    ? 'All Sections'
                    : st === 'STAT'
                    ? 'Stats Counters'
                    : st === 'MISSION'
                    ? 'Mission'
                    : st === 'VISION'
                    ? 'Vision'
                    : st === 'VALUE'
                    ? 'Core Values'
                    : 'Process Steps'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCreateSection('STAT')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                + Add Stat
              </button>
              <button
                type="button"
                onClick={() => handleOpenCreateSection('VALUE')}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 cursor-pointer shadow-xs"
              >
                + Add Core Value
              </button>
            </div>
          </div>

          {/* Section Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSections.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 group hover:border-sky-300 dark:hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900">
                      {item.section_type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Order: #{item.display_order}
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5">
                    {/* Circle Icon Badge */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/10 via-sky-500/20 to-blue-600/10 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                      <DynamicIcon name={item.icon} customIconUrl={item.effective_custom_icon} alt={item.title} className="w-6 h-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                      </div>
                      {item.subtitle_or_value && (
                        <p className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                          {item.subtitle_or_value}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.effective_custom_icon ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                            <ImageIcon className="w-3 h-3" /> Custom Photo Icon
                          </span>
                        ) : (
                          <>Icon: <code className="text-sky-600 dark:text-sky-300">{item.icon}</code></>
                        )}
                      </p>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      item.is_active ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {item.is_active ? 'Active' : 'Hidden'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSection(item)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-600 transition cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit & Change Icon</span>
                    </button>
                    {item.section_type !== 'MISSION' && item.section_type !== 'VISION' && (
                      <button
                        type="button"
                        onClick={() => setDeleteSection(item)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. ADD / EDIT PHOTO SHOWCASE MODAL                                     */}
      {/* ===================================================================== */}
      {galleryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !photoSubmitting) setGalleryModalOpen(false);
          }}
        >
          <div className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 flex items-center justify-center font-bold">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingPhoto ? 'Edit Showcase Photo' : 'Add Showcase Photo'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Includes headline, badge, and detailed story content for &ldquo;View Contents&rdquo;.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGalleryModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitPhoto} className="modal-scrollable overscroll-contain flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Photo Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kathmandu Innovation Hub & Engineering Center"
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category Tag *
                  </label>
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="Culture">Culture</option>
                    <option value="Team">Team</option>
                    <option value="Events">Events</option>
                    <option value="Office">Office</option>
                    <option value="Community">Community</option>
                    <option value="Workshops">Workshops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Short Subtitle / Caption
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Where technology meets recruitment innovation"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Image Input Options */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Photo Source (Upload File or Direct Link) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Upload from Computer</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Or External Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={photoImageUrl}
                      onChange={(e) => {
                        setPhotoImageUrl(e.target.value);
                        if (!photoImageFile) setPhotoImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {photoImagePreview && (
                  <div className="pt-2 flex items-center gap-3">
                    <img
                      src={photoImagePreview}
                      alt="Preview"
                      className="w-20 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Image preview active
                    </p>
                  </div>
                )}
              </div>

              {/* View Contents Detailed Story */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>View Contents Detailed Story (Shown when visitor clicks &ldquo;View Contents&rdquo;)</span>
                  <span className="text-[11px] font-normal text-slate-400">{photoDescription.length} chars</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the moment, the people involved, the milestone achieved, or what makes this aspect of Jagir AI unique..."
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={photoOrder}
                    onChange={(e) => setPhotoOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Visibility
                  </label>
                  <label className="flex items-center gap-2 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={photoActive}
                      onChange={(e) => setPhotoActive(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    />
                    <span>Active on Public About Page</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setGalleryModalOpen(false)}
                  disabled={photoSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={photoSubmitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {photoSubmitting ? 'Saving Photo...' : editingPhoto ? 'Update Photo' : 'Add Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. EDIT SECTION & ICON PICKER MODAL                                   */}
      {/* ===================================================================== */}
      {sectionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !sectionSubmitting) setSectionModalOpen(false);
          }}
        >
          <div className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 flex items-center justify-center font-bold overflow-hidden">
                  <DynamicIcon name={sectionIcon} customIconUrl={iconMode === 'custom' ? customIconPreview : null} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingSection ? `Edit ${editingSection.section_type}` : `Add New ${sectionType}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pick a preset icon or upload a custom photo icon for this item.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSectionModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitSection} className="modal-scrollable overscroll-contain flex-1 overflow-y-auto p-6 space-y-5">
              {/* VISUAL ICON PICKER & INSERT CUSTOM PHOTO */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Icon / Photo *</span>
                  </label>
                  <span className="text-[11px] font-bold">
                    {iconMode === 'custom' && customIconPreview ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Custom Photo Active
                      </span>
                    ) : (
                      <span className="text-sky-600 dark:text-sky-400">
                        Active: <code className="bg-sky-100 dark:bg-sky-950/80 px-1.5 py-0.5 rounded">{sectionIcon}</code>
                      </span>
                    )}
                  </span>
                </div>

                {/* Tabs to switch between Preset Icons and Insert Photo */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIconMode('preset')}
                    className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                      iconMode === 'preset'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Preset Icons
                  </button>
                  <button
                    type="button"
                    onClick={() => setIconMode('custom')}
                    className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                      iconMode === 'custom'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Insert Photo / Custom Icon
                  </button>
                </div>

                {/* PRESET LUCIDE ICONS */}
                {iconMode === 'preset' && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search icons (e.g. Briefcase, Target, Shield, Users, Zap, Star)..."
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div className="modal-scrollable overscroll-contain grid grid-cols-7 sm:grid-cols-9 gap-2 max-h-36 overflow-y-auto p-1">
                      {filteredIcons.map((icName) => {
                        const isSelected = icName.toLowerCase() === sectionIcon.toLowerCase();
                        return (
                          <button
                            key={icName}
                            type="button"
                            onClick={() => setSectionIcon(icName)}
                            title={icName}
                            className={`p-2 rounded-xl flex flex-col items-center justify-center transition cursor-pointer border ${
                              isSelected
                                ? 'bg-sky-600 text-white border-sky-600 shadow-sm scale-105'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-sky-50 hover:border-sky-300'
                            }`}
                          >
                            <DynamicIcon name={icName} className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* INSERT PHOTO / CUSTOM ICON */}
                {iconMode === 'custom' && (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                    {customIconPreview ? (
                      <div className="flex items-center gap-3.5 p-3 bg-white dark:bg-slate-900 rounded-xl border border-sky-200 dark:border-sky-800 shadow-2xs">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={customIconPreview}
                            alt="Custom Icon Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {customIconFile ? customIconFile.name : 'Custom Icon Image'}
                          </p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                            <Check className="w-3 h-3" /> Custom photo active
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCustomIcon}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition border border-rose-200 dark:border-rose-800 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-sky-300 dark:border-sky-800 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-sky-50/50 dark:hover:bg-sky-950/30 transition">
                        <UploadCloud className="w-8 h-8 text-sky-500 mb-1" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Click to Insert Photo / Custom Icon
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          PNG, SVG, JPG, WebP (Square ratio looks best)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCustomIconFileChange}
                          className="hidden"
                        />
                      </label>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Or enter direct Image URL (optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/custom-icon.png"
                        value={customIconUrl}
                        onChange={(e) => {
                          setCustomIconUrl(e.target.value);
                          if (!customIconFile) setCustomIconPreview(e.target.value || null);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Active Job Listings or Integrity & Verification"
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {sectionType === 'STAT' ? 'Metric Value (e.g. 5,000+)' : 'Tag / Pill Badge (e.g. 100% Verified)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5,000+ or AI-Powered or Core Purpose"
                    value={sectionSubtitle}
                    onChange={(e) => setSectionSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Description */}
              {sectionType !== 'STAT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Detailed Explanation
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Explain the mission, vision, or core value principles..."
                    value={sectionDesc}
                    onChange={(e) => setSectionDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={sectionOrder}
                    onChange={(e) => setSectionOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Active Status
                  </label>
                  <label className="flex items-center gap-2 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sectionActive}
                      onChange={(e) => setSectionActive(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    />
                    <span>Active on About Page</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSectionModalOpen(false)}
                  disabled={sectionSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionSubmitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {sectionSubmitting ? 'Saving...' : editingSection ? 'Update Section' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. PREVIEW "VIEW CONTENTS" LIGHTBOX MODAL                             */}
      {/* ===================================================================== */}
      {previewGalleryItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overscroll-contain select-none"
          onClick={() => setPreviewGalleryItem(null)}
        >
          <div
            className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh] overscroll-contain select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setPreviewGalleryItem(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition cursor-pointer backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Photo Section */}
            <div className="w-full h-72 sm:h-96 bg-slate-100 dark:bg-slate-800 relative shrink-0">
              {previewGalleryItem.effective_image ? (
                <img
                  src={previewGalleryItem.effective_image}
                  alt={previewGalleryItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
              <span className="absolute bottom-4 left-4 px-3 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white shadow-md">
                {previewGalleryItem.category}
              </span>
            </div>

            {/* Content Story Section */}
            <div className="modal-scrollable p-6 sm:p-8 overflow-y-auto overscroll-contain space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                View Contents & Visual Story
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {previewGalleryItem.title}
              </h2>
              {previewGalleryItem.caption && (
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 italic border-l-4 border-sky-500 pl-3">
                  {previewGalleryItem.caption}
                </p>
              )}
              <div className="pt-2 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {previewGalleryItem.description || 'No detailed story contents provided yet.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. DELETE CONFIRMATION MODAL                                          */}
      {/* ===================================================================== */}
      {(deletePhoto || deleteSection) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            if (!deleting) {
              setDeletePhoto(null);
              setDeleteSection(null);
            }
          }}
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete {deletePhoto ? 'Showcase Photo' : 'Section Item'}?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  &ldquo;{deletePhoto?.title || deleteSection?.title}&rdquo;
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletePhoto(null);
                  setDeleteSection(null);
                }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deletePhoto ? handleDeletePhotoConfirm : handleDeleteSectionConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

