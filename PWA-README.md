# 📱 Gestionnaire de Commandes - PWA Offline-First

Application web progressive (PWA) pour gérer les commandes et factures avec support complet **offline** et **synchronisation automatique**.

## ✨ Fonctionnalités

- ✅ **Fonctionne hors ligne** - Continuez à créer des commandes sans internet
- ✅ **Synchronisation automatique** - Les données se synchronisent avec Firebase quand vous êtes en ligne
- ✅ **Installable** - Installez comme une app native sur votre téléphone/ordinateur
- ✅ **Service Worker** - Cache intelligent pour chargement rapide
- ✅ **IndexedDB** - Base de données locale sécurisée
- ✅ **Interface responsive** - Fonctionne sur tous les appareils
- ✅ **Authentification Firebase** - Sécurisé avec login
- ✅ **Facturation** - Génération de factures PDF
- ✅ **Analytiques** - Statistiques complètes

## 🚀 Installation

### En tant que PWA (Recommandé)

**Sur navigateur desktop :**
1. Ouvrez [gestionnaire-dmib.vercel.app](https://gestionnaire-dmib.vercel.app)
2. Cliquez sur l'icône **Installer** (en haut à droite) ou l'adresse
3. Sélectionnez **"Installer l'app"**

**Sur téléphone Android :**
1. Ouvrez l'app dans Chrome
2. Tapez le menu (3 points) → **"Installer l'app"**

**Sur iPhone/iPad :**
1. Ouvrez l'app dans Safari
2. Tapez **Partager** → **"Sur l'écran d'accueil"**

## 🔌 Utilisation

### Avec Internet
- L'app se synchronise avec Firebase en temps réel
- Les données sont sauvegardées dans le cloud

### Hors Ligne
- L'app sauvegarde automatiquement en local
- Un indicateur orange aparaît en bas à gauche
- Continuez à ajouter des commandes/clients
- **Quand l'internet revient**, les données se synchronisent automatiquement

## 🛠️ Installation locale

```bash
# Cloner le repo
git clone https://github.com/brayano-ux/gestionnaire.git
cd gestionnaire/vite-project

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Build pour production
npm run build
```

## 📦 Structure

```
vite-project/
├── public/
│   ├── manifest.json       # Manifest PWA
│   └── sw.ts              # Service Worker
├── src/
│   ├── App.tsx            # Composant principal
│   ├── components/
│   │   ├── OfflineIndicator.tsx
│   │   └── Navbar.tsx
│   ├── utils/
│   │   ├── offlineDB.ts    # IndexedDB helper
│   │   └── syncManager.ts  # Sync offline/online
│   └── main.tsx
└── package.json
```

## 🔐 Sécurité

### ⚠️ Clés Firebase exposées
Les clés Firebase sont visibles dans le code (normal pour une app front-end publique). 
**Protégez votre backend avec des règles de sécurité Firestore :**

```javascript
// Firestore Rules (à appliquer dans Console Firebase)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /clients/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /settings/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📱 Support Offline

### Base de données locale
- **IndexedDB** : Stockage persistant sur l'appareil
- **Service Worker** : Cache des assets
- **Sync Queue** : File d'attente pour synchronisation

### Synchronisation
- Automatique quand vous revenez online
- Manuel si nécessaire (impossible pour l'instant, prévu pour v2)

## 🌐 Déploiement

### Vercel (Production)
L'app se redéploie automatiquement à chaque push sur GitHub.

### Local PWA
```bash
npm run build
npm run preview
# L'app est accessible en HTTPS (requis pour PWA)
```

## 🐛 Troubleshooting

### L'app se charge lentement
- Videz le cache du navigateur
- Forcez le refresh (Ctrl+Shift+R ou Cmd+Shift+R)

### L'install PWA n'apparaît pas
- Assurez-vous d'être en **HTTPS** (Vercel l'est automatiquement)
- Utilisez un **navigateur moderne** (Chrome 67+, Firefox 102+, Safari 15.1+, Edge 88+)

### Les données ne se synchronisent pas
- Vérifiez votre connexion internet
- Ouvrez la console (F12) pour voir les logs
- Reconnectez-vous à Firebase si nécessaire

## 🚀 Roadmap v2

- [ ] Synchronisation manuelle (bouton "Sync")
- [ ] Statistiques offline
- [ ] Partage de factures hors ligne
- [ ] Support complet Android/iOS
- [ ] Notifications push

## 📄 License

MIT

## 👨‍💻 Auteur

[Brayan - brayano-ux](https://github.com/brayano-ux)
