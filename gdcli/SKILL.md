---
name: gdcli
description: Google Drive CLI for listing, searching, uploading, downloading, and sharing files and folders.
---

# Google Drive CLI

Command-line interface for Google Drive operations.

## Installation

```bash
npm install -g @mariozechner/gdcli
```

## Setup

### Google Cloud Console (one-time)

1. [Create a new project](https://console.cloud.google.com/projectcreate) (or select existing)
2. [Enable the Google Drive API](https://console.cloud.google.com/apis/api/drive.googleapis.com)
3. [Set app name](https://console.cloud.google.com/auth/branding) in OAuth branding
4. [Add test users](https://console.cloud.google.com/auth/audience) (all Gmail addresses you want to use)
5. [Create OAuth client](https://console.cloud.google.com/auth/clients):
   - Click "Create Client"
   - Application type: "Desktop app"
   - Download the JSON file

### Configure gdcli

First check if already configured:
```bash
gdcli accounts list
```

If no accounts, guide the user through setup:
1. Ask if they have a Google Cloud project with Drive API enabled
2. If not, walk them through the Google Cloud Console steps above
3. Have them download the OAuth credentials JSON
4. Run: `gdcli accounts credentials ~/path/to/credentials.json`
5. Run: `gdcli accounts add <email>` (use `--manual` for browserless OAuth)

## Usage

Run `gdcli --help` for full command reference.

Common operations:
- `gdcli <email> ls [folderId]` - List files/folders
- `gdcli <email> search "<query>"` - Search for files
- `gdcli <email> download <fileId> [destPath]` - Download a file
- `gdcli <email> upload <localPath> [--folder <folderId>]` - Upload a file
- `gdcli <email> mkdir <name>` - Create a folder
- `gdcli <email> share <fileId> --anyone` - Share publicly

## Data Storage

- `~/.gdcli/credentials.json` - OAuth client credentials
- `~/.gdcli/accounts.json` - Account tokens
- `~/.gdcli/downloads/` - Default download location
