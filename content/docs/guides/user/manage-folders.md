---
title: 'Manage Folders'
description: 'Organize your files with folders in TMA Cloud.'
---

Organize your files with folders in TMA Cloud.

## Creating Folders

### Basic Creation

1. Navigate to where you want to create a folder
2. Click the **New folder** button in the toolbar, or right-click empty space in the list → **New folder**
3. The dialog suggests **New folder** (or **New folder (2)** if that is taken), selected so typing replaces it
4. Press Enter or click **Create**

If the folder already holds an item with the typed name, in any letter case, the dialog says so and **Create** stays off until the name changes.

A folder name can be up to 255 characters and cannot contain `/`, `\` or control characters. Characters that Windows does not allow, such as `:` or `?`, are accepted. See [File Names](/docs/concepts/file-system#file-names).

### Nested Folders

- Create folders inside other folders
- Unlimited nesting depth
- Hierarchical organization

## Folder Operations

### Moving Folders

- **Drag and Drop:** Drag a folder onto another folder, then confirm
- **Cut and Paste:** Right-click → **Cut** (or **Ctrl+X**), open the destination, then **Ctrl+V** or right-click empty space → **Paste**
- **Bulk Move:** Select multiple folders and move them together

### Copying Folders

- **Copy and Paste:** Right-click → **Copy** (or **Ctrl+C**), open the destination, then paste
- **Bulk Copy:** Select multiple folders and copy together
- **Recursive:** All contents copied automatically
- **Background job:** The copy continues on the worker if the request closes

### Name Conflicts

When a moved or copied folder has the same name as a folder already in the destination, both are kept and the new one is renamed, for example `Photos (1)`. Names are compared without regard to case. Folders moved back into their own parent keep their names.

A move or copy fails if the folder or the destination was deleted or moved to the trash in the meantime. Moving a folder into itself or one of its subfolders is refused.

### Renaming Folders

- **Rename Option:** Right-click → Rename
- **Inline Edit:** Click folder name to edit
- **Validation:** The same rule as creating a folder: up to 255 characters, with no `/`, `\` or control characters

### Deleting Folders

- **Delete Option:** Right-click → Delete
- **Soft Delete:** Moves to trash (not permanent)
- **Recursive:** All contents moved to trash

## Folder Organization

### Best Practices

- Use descriptive folder names
- Organize by project or category
- Keep folder structure shallow when possible
- Use consistent naming conventions

### Navigation

- **Breadcrumbs:** Navigate up folder hierarchy; the folder you came from is selected
- **Keyboard:** **Enter** opens the selected folder, **Backspace** goes back to the previous folder, and **Alt+Up** goes to the parent folder. Typing the first letters of a name or using the arrow keys selects an item. See [Keyboard Navigation](/docs/guides/user/upload-files#keyboard-navigation).
- **Back/Forward:** The arrows left of the folder path move through folder history. The mouse's back and forward side buttons do the same over the file list.
- **Search:** Find folders by name

## Folder Sharing

### Sharing Folders

- Share entire folders with share links
- All folder contents accessible via share
- New files automatically included

## Related Topics

- [Upload Files](/docs/guides/user/upload-files) - Add files to folders
- [Share Files](/docs/guides/user/share-files) - Share folders with others
- [Trash & Restore](/docs/guides/user/trash-restore) - Recover deleted folders
