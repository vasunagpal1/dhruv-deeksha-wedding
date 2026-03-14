# Full Guide: GitHub + Hosting + Couple Photos

This website is a plain static site. That means:

- no backend is needed
- no build command is needed
- GitHub Pages can host it directly

The only important files are:

- `index.html`
- `styles.css`
- `app.js`
- `assets/`

## Part 1: Connect GitHub and host the site there

### Step 1: Make sure the local folder is ready

This folder is already set up as a Git repository on the `main` branch.

Before pushing, update these final placeholders if you already know them:

1. Open `index.html`
2. Search for `Add final dates`
3. Replace it with your actual wedding date text
4. Search for `Add WhatsApp or phone`
5. Replace it with your RSVP number or contact text

### Step 2: Create a GitHub repository in the browser

1. Sign in to [GitHub](https://github.com)
2. Click the `+` button in the top-right corner
3. Click `New repository`
4. Enter a repository name
   Good example: `dhruv-deeksha-wedding`
5. Choose visibility:
   `Public` is the easiest option for GitHub Pages
6. Do not check:
   `Add a README file`
7. Do not check:
   `Add .gitignore`
8. Do not add a license
9. Click `Create repository`

After GitHub creates the repo, keep that page open. You will need the repository URL.

It will look like one of these:

- `https://github.com/YOUR-USERNAME/dhruv-deeksha-wedding.git`
- `git@github.com:YOUR-USERNAME/dhruv-deeksha-wedding.git`

Use the `https://` version unless you already use SSH with GitHub.

### Step 3: Set your Git identity on this Mac if needed

Run these in Terminal:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

To check them:

```bash
git config --global user.name
git config --global user.email
```

### Step 4: Create the first commit

Inside this project folder, run:

```bash
git add .
git commit -m "Initial wedding invitation site"
```

### Step 5: Connect the local project to GitHub

Replace the URL below with your actual GitHub repo URL:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

If Git says `origin already exists`, run:

```bash
git remote set-url origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### Step 6: Turn on GitHub Pages

After the code is on GitHub:

1. Open your repository on GitHub
2. Click `Settings`
3. In the left sidebar, click `Pages`
4. Under `Build and deployment`, find `Source`
5. Choose `Deploy from a branch`
6. Under `Branch`, select:
   `main`
7. Under folder, select:
   `/ (root)`
8. Click `Save`

Wait 1 to 5 minutes.

GitHub Pages will generate your live URL.

It will usually be:

- `https://YOUR-USERNAME.github.io/YOUR-REPO/`

If your repository name is exactly `YOUR-USERNAME.github.io`, then the URL will be:

- `https://YOUR-USERNAME.github.io/`

### Step 7: Open the live website

After GitHub Pages finishes deploying:

1. Go back to `Settings`
2. Open `Pages`
3. Click the live URL GitHub shows

### Step 8: Update the website later

Any future change follows the same pattern:

```bash
git add .
git commit -m "Describe your update"
git push
```

GitHub Pages will redeploy automatically after the push.

## Part 2: How to add couple images to the website

There are two ways to do this.

### Option A: Permanent published method

Use this when you want every guest to see the real couple images on the live website.

This is the recommended method.

#### Where the site expects the files

The site already looks for these exact files:

- `assets/dhruv-deeksha-1.jpg`
- `assets/dhruv-deeksha-2.jpg`

#### What to do

1. Choose the first couple photo
   Best for the opening section
2. Choose the second couple photo
   Best for the later wedding section
3. Rename them exactly to:
   `dhruv-deeksha-1.jpg`
   and
   `dhruv-deeksha-2.jpg`
4. Put both files inside the `assets` folder
5. If Finder asks whether to replace the existing files, click `Replace`

#### After replacing the files

Push the changes to GitHub:

```bash
git add assets/dhruv-deeksha-1.jpg assets/dhruv-deeksha-2.jpg
git commit -m "Add final couple portraits"
git push
```

GitHub Pages will update the live site automatically.

#### Recommended photo format

- Use JPG files
- Portrait orientation looks best
- Similar height and width ratio to the current images works best
- Around `1200 x 1800` is a good target

### Option B: Temporary browser preview method

Use this if you only want to test how the site looks on your own device before replacing the real files.

#### Important limitation

This method does **not** publish the photos to GitHub.

It only saves them in your current browser on your current device.

#### How to use it

1. Open the website in your browser
2. Click `Load your portraits`
3. In `Portrait one`, either:
   paste a public image URL
   or
   choose an image file from your computer
4. In `Portrait two`, do the same
5. The page will update instantly in that browser

#### When to use this method

- previewing different photos
- testing crop and look
- checking whether a photo fits the design

#### When not to use this method

Do not rely on it for the final live wedding invite.

For the final public site, always use **Option A** and replace the real files in `assets/`.

## Part 3: If GitHub Pages does not show the site

Check these one by one:

1. Make sure the repo contains `index.html` in the root
2. Make sure GitHub Pages is set to:
   `main` and `/ (root)`
3. Make sure the latest changes were pushed with `git push`
4. Wait a few minutes and refresh the `Pages` settings screen
5. If Pages shows a build problem, check the repository `Actions` tab

## Part 4: Best order to finish this project

Follow this order:

1. Replace the two couple portrait files
2. Update final date text in `index.html`
3. Update RSVP text in `index.html`
4. Create the GitHub repo
5. Run `git add`, `git commit`, and `git push`
6. Turn on GitHub Pages
7. Open the live URL and test on phone and desktop
