export type SavedJobItem = {
  id: string;
  title: string;
  company: string;
  location?: string;
  modality?: string;
  salary?: string;
  savedAt: string;
};

export type SavedPostItem = {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt?: string;
  savedAt: string;
};

type SavedStore = {
  jobs: SavedJobItem[];
  posts: SavedPostItem[];
};

const SAVED_KEY = "joblify.saved.items";

const emptyStore = (): SavedStore => ({ jobs: [], posts: [] });

const readStore = (): SavedStore => {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<SavedStore>;
    return {
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
    };
  } catch {
    return emptyStore();
  }
};

const writeStore = (store: SavedStore) => {
  localStorage.setItem(SAVED_KEY, JSON.stringify(store));
};

export const getSavedStore = (): SavedStore => readStore();

export const getSavedJobs = (): SavedJobItem[] => readStore().jobs;

export const getSavedPosts = (): SavedPostItem[] => readStore().posts;

export const isJobSaved = (jobId: string): boolean =>
  readStore().jobs.some((item) => item.id === jobId);

export const isPostSaved = (postId: string): boolean =>
  readStore().posts.some((item) => item.id === postId);

export const toggleSaveJob = (job: Omit<SavedJobItem, "savedAt">): boolean => {
  const store = readStore();
  const exists = store.jobs.some((item) => item.id === job.id);
  if (exists) {
    store.jobs = store.jobs.filter((item) => item.id !== job.id);
    writeStore(store);
    return false;
  }

  store.jobs.unshift({ ...job, savedAt: new Date().toISOString() });
  writeStore(store);
  return true;
};

export const toggleSavePost = (post: Omit<SavedPostItem, "savedAt">): boolean => {
  const store = readStore();
  const exists = store.posts.some((item) => item.id === post.id);
  if (exists) {
    store.posts = store.posts.filter((item) => item.id !== post.id);
    writeStore(store);
    return false;
  }

  store.posts.unshift({ ...post, savedAt: new Date().toISOString() });
  writeStore(store);
  return true;
};
