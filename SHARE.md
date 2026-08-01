# Rasoira — Kisi ko bhejne ke liye (Full files)

## Sabse aasaan: ZIP download (Git ki zaroorat nahi)

**Poora project ek saath download:**

👉 **https://github.com/Niravbodana/dangerai.com/archive/refs/heads/main.zip**

1. Link phone/PC browser mein kholo  
2. ZIP download hogi (~5–8 MB code + recipes)  
3. Extract / unzip karo  
4. Folder ka naam hoga: `dangerai.com-main`  
5. Andar jao: `dangerai.com-main/aaj-kyabanayein` — **yahi app hai**

---

## Git se clone (developers ke liye)

```bash
git clone https://github.com/Niravbodana/dangerai.com.git
cd dangerai.com/aaj-kyabanayein
```

---

## Kaunsi files ZIP mein aati hain?

| Folder / file | Kya hai |
|---------------|---------|
| `aaj-kyabanayein/client/` | React app (UI) |
| `aaj-kyabanayein/server/` | Node API |
| `aaj-kyabanayein/server/src/data/curated/recipes.json` | **898 recipes** (~2.5 MB) |
| `aaj-kyabanayein/client/public/home/` | Home images |
| `package.json` | Install scripts |

**ZIP mein NAHI aati (normal hai):**

| Missing | Kyon | Kya karna hai |
|---------|------|----------------|
| `node_modules/` | Bahut badi | `npm run install:all` |
| `server/.env` | Secret keys | Copy `server/.env.example` → `.env` |
| `server/data/image-cache/` | Auto cache | App chalate hi banegi |

---

## Download ke baad verify

```bash
cd dangerai.com-main/aaj-kyabanayein   # ya clone path
npm run verify
```

Sab green ho to files complete hain.

---

## Chalana

```bash
npm run install:all
npm run dev:server    # terminal 1
npm run dev:client    # terminal 2
```

Browser: http://localhost:3000

---

## Agar GitHub page par files dikhein hi nahi

- Branch **`main`** select karo (top-left dropdown)  
- App folder: https://github.com/Niravbodana/dangerai.com/tree/main/aaj-kyabanayein  
- Badi file `recipes.json` browser mein slow khulti hai — ZIP se download karo

**Direct recipes file (optional):**  
https://github.com/Niravbodana/dangerai.com/blob/main/aaj-kyabanayein/server/src/data/curated/recipes.json  
(Right side **Download raw file** / **Raw** button)
