import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Package,
  DollarSign,
  Users,
  FileText,
  Trash2,
  Edit2,
  Download,
  Search,
  Settings,
  User,
  Sun,
  Moon,
  BarChart3,
  X,
} from "lucide-react";

// Firebase imports
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// 🔐 Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAigx8KtDCEulSWjpu17fnYsrqK7C9o3R8",
  authDomain: "petit-jobs-express.firebaseapp.com",
  projectId: "petit-jobs-express",
  storageBucket: "petit-jobs-express.appspot.com",
  messagingSenderId: "446118780236",
  appId: "1:446118780236:web:08c3a87d56bcd67399c3e9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 📋 INTERFACES TYPESCRIPT
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  stock: number;
}

interface Order {
  id: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  items: OrderItem[];
  status: 'pending' | 'paid' | 'delivered';
  notes: string;
  total: number;
  date: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  firstOrder: string;
  lastOrder: string;
}

interface ShopSettings {
  name: string;
  phone: string;
  address: string;
  signature: string;
  email: string;
  logo: string;
}

interface FormData {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  items: OrderItem[];
  status: 'pending' | 'paid' | 'delivered';
  notes: string;
}

const OrderManagerDemo = () => {
  // États principaux
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [currentView, setCurrentView] = useState("dashboard");
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    name: "Ma Boutique",
    phone: "+237 6XX XXX XXX",
    address: "Douala, Cameroun",
    signature: "Le Responsable",
    email: "",
    logo: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [itemCount, setItemCount] = useState("");
  const [showItemForm, setShowItemForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState("login");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Order | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    items: [],
    status: "pending",
    notes: "",
  });

  // 🔐 AUTHENTIFICATION FIREBASE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      if (user) {
        setIsAuthenticated(true);
        loadDataFromFirebase();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 📦 CHARGEMENT DES DONNÉES FIREBASE (optimisé)
  const loadDataFromFirebase = async () => {
    try {
      setLoading(true);

      const [ordersSnapshot, clientsSnapshot, settingsDoc] = await Promise.all([
        getDocs(query(collection(db, "orders"), orderBy("date", "desc"))),
        getDocs(query(collection(db, "clients"))),
        getDoc(doc(db, "settings", "shop")),
      ]);

      const ordersData = ordersSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      } as any)) as Order[];
      setOrders(ordersData);

      const clientsData = clientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as any)) as Client[];
      setClients(clientsData);

      if (settingsDoc.exists()) {
        setShopSettings(settingsDoc.data() as any as ShopSettings);
      }

      setLoading(false);
    } catch (error) {
      console.error("Erreur chargement Firebase:", error);
      setLoading(false);
    }
  };

  // 💾 SAUVEGARDE FIREBASE
  const saveOrderToFirebase = async (order: Order) => {
    try {
      if (editingOrder) {
        const { id, ...orderData } = order;
        await updateDoc(doc(db, "orders", order.id), orderData as any);
      } else {
        const docRef = await addDoc(collection(db, "orders"), order);
        order.id = docRef.id;
        await updateDoc(docRef, { id: docRef.id });
      }
    } catch (error) {
      console.error("Erreur sauvegarde commande:", error);
      throw error;
    }
  };

  const saveClientToFirebase = useCallback(async (client: Client) => {
    try {
      const clientRef = doc(db, "clients", client.id.toString());
      await setDoc(clientRef, client);
    } catch (error) {
      console.error("Erreur sauvegarde client:", error);
    }
  }, []);

  const saveSettingsToFirebase = useCallback(async (settings: ShopSettings) => {
    try {
      await setDoc(doc(db, "settings", "shop"), settings);
    } catch (error) {
      console.error("Erreur sauvegarde paramètres:", error);
    }
  }, []);

  // 🔢 FONCTION POUR DEMANDER LE NOMBRE D'ARTICLES
  const handleStartOrder = () => {
    setShowForm(true);
    setEditingOrder(null);
    setFormData({
      clientName: "",
      clientPhone: "",
      clientAddress: "",
      items: [],
      status: "pending",
      notes: "",
    });
    setShowItemForm(false);
    setItemCount("");
  };

  const confirmItemCount = () => {
    const count = parseInt(itemCount);
    if (!count || count < 1 || count > 50) {
      alert("Veuillez entrer un nombre entre 1 et 50");
      return;
    }

    const newItems = Array.from({ length: count }, () => ({
      name: "",
      quantity: 1,
      price: 0,
      stock: 0,
    }));

    setFormData({
      ...formData,
      items: newItems,
    });
    setShowItemForm(true);
  };

  // Fonctions de calcul avec useMemo pour optimisation
  const calculateTotal = useCallback((items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }, []);

  // 📊 ANALYTIQUES AVANCÉES (optimisé avec useMemo)
  const stats = useMemo(() => {
    if (orders.length === 0) {
      return {
        total: 0,
        pending: 0,
        paid: 0,
        delivered: 0,
        revenue: 0,
        weeklyRevenue: 0,
        revenueByDay: {},
        revenueByMonth: {},
        topClients: [],
        topItems: [],
        conversionRate: 0,
        averageOrderValue: 0,
        ordersByStatus: { pending: 0, paid: 0, delivered: 0 },
      };
    }

    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyOrders = orders.filter(
      (order) => new Date(order.date) > lastWeek
    );

    const revenueByDay: Record<string, number> = {};
    const ordersByStatus = {
      pending: 0,
      paid: 0,
      delivered: 0,
    };

    const revenueByMonth: Record<string, number> = {};
    const popularItems: Record<string, number> = {};

    orders.forEach((order) => {
      ordersByStatus[order.status]++;

      const date = new Date(order.date);
      const dayKey = date.toLocaleDateString();
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;

      if (order.status === "paid" || order.status === "delivered") {
        revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + order.total;
        revenueByMonth[monthKey] =
          (revenueByMonth[monthKey] || 0) + order.total;
      }

      order.items.forEach((item) => {
        popularItems[item.name] =
          (popularItems[item.name] || 0) + item.quantity;
      });
    });

    const topItems = Object.entries(popularItems)
      .map(([name, quantity]) => ({ name, quantity: quantity as number }))
      .sort((a, b) => (b.quantity as number) - (a.quantity as number))
      .slice(0, 5);

    const conversionRate = orders.length > 0
      ? ((ordersByStatus.paid + ordersByStatus.delivered) / orders.length * 100).toFixed(1)
      : 0;

    const averageOrderValue = orders.length > 0
      ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
      : 0;

    const revenue = orders
      .filter((o) => o.status === "paid" || o.status === "delivered")
      .reduce((sum, o) => sum + o.total, 0);

    const weeklyRevenue = weeklyOrders
      .filter((o) => o.status === "paid" || o.status === "delivered")
      .reduce((sum, o) => sum + o.total, 0);

    const topClients = clients
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      total: orders.length,
      pending: ordersByStatus.pending,
      paid: ordersByStatus.paid,
      delivered: ordersByStatus.delivered,
      revenue,
      weeklyRevenue,
      revenueByDay,
      revenueByMonth,
      topClients,
      topItems,
      conversionRate,
      averageOrderValue,
      ordersByStatus,
    };
  }, [orders, clients]);

  // Gestion des articles
  const addItem = useCallback(() => {
    setFormData((prev: FormData) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1, price: 0, stock: 0 }],
    }));
  }, []);

  const updateItem = useCallback((index: number, field: keyof OrderItem, value: string | number) => {
    setFormData((prev: FormData) => {
      const newItems = [...prev.items];
      if (field === "name") {
        newItems[index][field] = value as string;
      } else {
        newItems[index][field] = Number(value);
      }
      return { ...prev, items: newItems };
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setFormData((prev: FormData) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  // 💾 SOUMISSION AVEC FIREBASE
  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientPhone || !formData.clientAddress) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const hasEmptyItem = formData.items.some(
      (item) => !item.name || item.quantity < 1 || item.price < 0
    );
    if (hasEmptyItem) {
      alert("Veuillez remplir tous les articles correctement");
      return;
    }

    const total = calculateTotal(formData.items);
    const orderWithoutId: Omit<Order, 'id'> = {
      ...formData,
      total,
      date: editingOrder?.date || new Date().toISOString(),
    };

    try {
      const orderToSave: Order = editingOrder
        ? { ...orderWithoutId, id: editingOrder.id }
        : { ...orderWithoutId, id: Date.now().toString() };
      await saveOrderToFirebase(orderToSave);

      const clientIndex = clients.findIndex(
        (c) => c.phone === formData.clientPhone
      );
      if (clientIndex === -1) {
        const newClient = {
          id: Date.now().toString(),
          name: formData.clientName,
          phone: formData.clientPhone,
          address: formData.clientAddress,
          totalOrders: 1,
          totalSpent: total,
          firstOrder: new Date().toISOString(),
          lastOrder: new Date().toISOString(),
        };
        await saveClientToFirebase(newClient);
      } else {
        const updatedClient = {
          ...clients[clientIndex],
          totalOrders: clients[clientIndex].totalOrders + 1,
          totalSpent: clients[clientIndex].totalSpent + total,
          lastOrder: new Date().toISOString(),
        };
        await saveClientToFirebase(updatedClient);
      }

      await loadDataFromFirebase();

      setFormData({
        clientName: "",
        clientPhone: "",
        clientAddress: "",
        items: [],
        status: "pending",
        notes: "",
      });
      setShowForm(false);
      setShowItemForm(false);
      setEditingOrder(null);
      setItemCount("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert("Erreur lors de la sauvegarde: " + errorMessage);
    }
  };

  // 🗑️ SUPPRESSION AVEC FIREBASE
  const deleteOrder = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      try {
        await deleteDoc(doc(db, "orders", id));
        await loadDataFromFirebase();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert("Erreur lors de la suppression: " + errorMessage);
      }
    }
  };

  const editOrder = useCallback((order: Order) => {
    setEditingOrder(order);
    setFormData({
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      clientAddress: order.clientAddress,
      items: order.items,
      status: order.status,
      notes: order.notes || "",
    });
    setShowForm(true);
    setShowItemForm(true);
    setCurrentView("orders");
  }, []);

  const updateStatus = async (id: string, status: 'pending' | 'paid' | 'delivered') => {
    try {
      await updateDoc(doc(db, "orders", id), { status });
      await loadDataFromFirebase();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert("Erreur mise à jour statut: " + errorMessage);
    }
  };

  // Filtrage et recherche avec useMemo
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientPhone.includes(searchTerm) ||
        order.id.toString().includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // 📤 EXPORT EXCEL
  const exportToExcel = useCallback(() => {
    const headers = [
      "ID",
      "Client",
      "Téléphone",
      "Adresse",
      "Total",
      "Statut",
      "Date",
      "Notes",
    ];
    const data = orders.map((order) => [
      order.id,
      order.clientName,
      order.clientPhone,
      order.clientAddress,
      order.total,
      order.status,
      new Date(order.date).toLocaleDateString("fr-FR"),
      order.notes || "",
    ]);

    const csvContent = [headers, ...data]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commandes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }, [orders]);

  // 🎯 SOLUTION ULTRA SIMPLE POUR LES FACTURES MOBILE
  const generateInvoice = useCallback((order: Order) => {
    // Détecter si on est sur mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Pour MOBILE : Afficher la facture dans une modal
    if (isMobile) {
      setCurrentInvoice(order);
      setShowInvoiceModal(true);
    } 
    // Pour DESKTOP : Télécharger en PDF via impression
    else {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Facture ${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .shop-name { font-size: 24px; font-weight: bold; color: #007bff; }
            .invoice-title { font-size: 20px; font-weight: bold; margin: 20px 0; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #007bff; color: white; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">${shopSettings.name}</div>
            <div>${shopSettings.phone}</div>
            <div>${shopSettings.address}</div>
          </div>
          
          <div class="invoice-title">FACTURE N° ${order.id}</div>
          
          <div><strong>Date:</strong> ${new Date(order.date).toLocaleDateString('fr-FR')}</div>
          <div><strong>Client:</strong> ${order.clientName}</div>
          <div><strong>Téléphone:</strong> ${order.clientPhone}</div>
          <div><strong>Adresse:</strong> ${order.clientAddress}</div>
          
          <table>
            <thead>
              <tr>
                <th>Article</th>
                <th>Quantité</th>
                <th>Prix Unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toLocaleString()} FCFA</td>
                  <td>${(item.quantity * item.price).toLocaleString()} FCFA</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">TOTAL: ${order.total.toLocaleString()} FCFA</div>
          
          <div style="margin-top: 40px; text-align: right;">
            <div style="border-top: 1px solid #000; width: 200px; display: inline-block; padding-top: 10px;">
              ${shopSettings.signature}
            </div>
          </div>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
          setTimeout(() => printWindow.close(), 1000);
        };
      }
    }
  }, [shopSettings]);

  // Fonction pour copier la facture sur mobile
  const copyInvoiceToClipboard = useCallback(() => {
    if (!currentInvoice) return;
    
    const invoiceText = `
FACTURE N° ${currentInvoice.id}
${shopSettings.name}
${shopSettings.phone}
${shopSettings.address}

Date: ${new Date(currentInvoice.date).toLocaleDateString('fr-FR')}
Client: ${currentInvoice.clientName}
Téléphone: ${currentInvoice.clientPhone}
Adresse: ${currentInvoice.clientAddress}

ARTICLES:
${currentInvoice.items.map(item => `- ${item.name}: ${item.quantity} x ${item.price.toLocaleString()} FCFA = ${(item.quantity * item.price).toLocaleString()} FCFA`).join('\n')}

TOTAL: ${currentInvoice.total.toLocaleString()} FCFA

Signature: ${shopSettings.signature}
Merci pour votre confiance!
    `.trim();
    
    navigator.clipboard.writeText(invoiceText)
      .then(() => alert('✅ Facture copiée dans le presse-papier !\n\nVous pouvez la partager via WhatsApp, SMS, ou toute autre application.'))
      .catch(() => {
        // Fallback pour les vieux navigateurs
        const textarea = document.createElement('textarea');
        textarea.value = invoiceText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✅ Facture copiée dans le presse-papier !\n\nVous pouvez la partager via WhatsApp, SMS, ou toute autre application.');
      });
  }, [currentInvoice, shopSettings]);

  // 🔐 FONCTIONS AUTHENTIFICATION
  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert("Erreur de connexion: " + errorMessage);
    }
  };

  const handleRegister = async (email: string, password: string, shopName: string) => {
    try {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const defaultSettings: ShopSettings = {
        name: shopName,
        phone: "+237 6XX XXX XXX",
        address: "Douala, Cameroun",
        signature: "Le Responsable",
        email: email,
        logo: "",
      };

      await saveSettingsToFirebase(defaultSettings);
      setShopSettings(defaultSettings);

      alert("Boutique créée avec succès !");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert("Erreur lors de l'inscription: " + errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  const StatusBadge = React.useMemo(() => {
    const StatusBadgeComponent = ({ status }: { status: 'pending' | 'paid' | 'delivered' }) => {
      const colors = {
        pending: darkMode
          ? "bg-orange-900 text-orange-300"
          : "bg-orange-100 text-orange-800",
        paid: darkMode
          ? "bg-green-900 text-green-300"
          : "bg-green-100 text-green-800",
        delivered: darkMode
          ? "bg-blue-900 text-blue-300"
          : "bg-blue-100 text-blue-800",
      };
      const labels = {
        pending: "En attente",
        paid: "Payé",
        delivered: "Livré",
      };
      return (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status]}`}
        >
          {labels[status]}
        </span>
      );
    };
    return StatusBadgeComponent;
  }, [darkMode]);

  const themeClasses = darkMode
    ? "bg-gray-900 text-white min-h-screen"
    : "bg-gray-50 min-h-screen";

  const cardClasses = darkMode
    ? "bg-gray-800 border-gray-700 text-white"
    : "bg-white border-gray-100";

  const inputClasses = darkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500";

  // 🔐 COMPOSANT DE CONNEXION/INSCRIPTION
  const AuthForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [shopName, setShopName] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (authView === "login") {
        handleLogin(email, password);
      } else {
        if (!shopName.trim()) {
          alert("Veuillez entrer un nom pour votre boutique");
          return;
        }
        handleRegister(email, password, shopName);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Package className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {authView === "login" ? "Connexion" : "Inscription Boutique"}
            </h1>
            <p className="text-gray-600 mt-2">
              {authView === "login"
                ? "Connectez-vous à votre compte"
                : "Créez votre boutique en ligne"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {authView === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de votre boutique *
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Ma Super Boutique"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre mot de passe"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
            >
              {authView === "login" ? "Se Connecter" : "Créer ma Boutique"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() =>
                setAuthView(authView === "login" ? "register" : "login")
              }
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {authView === "login"
                ? "📦 Nouvelle boutique ? Créer un compte"
                : "👋 Déjà un compte ? Se connecter"}
            </button>
          </div>

          {authView === "register" && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                🎯 Votre boutique inclut :
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✅ Gestion complète des commandes</li>
                <li>✅ Base de données cloud sécurisée</li>
                <li>✅ Factures professionnelles</li>
                <li>✅ Analytics en temps réel</li>
                <li>✅ Synchronisation multi-appareils</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Écran d'authentification
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return (
    <div className={themeClasses}>
      {/* Modal de facture pour mobile */}
      {showInvoiceModal && currentInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${cardClasses} rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Facture N° {currentInvoice.id}</h3>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* En-tête */}
                <div className="text-center border-b pb-4">
                  <div className="text-lg font-bold text-blue-600">{shopSettings.name}</div>
                  <div className="text-sm text-gray-600">{shopSettings.phone}</div>
                  <div className="text-sm text-gray-600">{shopSettings.address}</div>
                </div>

                {/* Infos */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>{new Date(currentInvoice.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Client:</span>
                    <span>{currentInvoice.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Téléphone:</span>
                    <span>{currentInvoice.clientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Adresse:</span>
                    <span>{currentInvoice.clientAddress}</span>
                  </div>
                </div>

                {/* Articles */}
                <div>
                  <h4 className="font-bold text-blue-600 mb-2">Articles:</h4>
                  <div className="space-y-2">
                    {currentInvoice.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.quantity} x {item.price.toLocaleString()} FCFA</div>
                        </div>
                        <div className="font-bold">
                          {(item.quantity * item.price).toLocaleString()} FCFA
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span className="text-blue-600">{currentInvoice.total.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Notes */}
                {currentInvoice.notes && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="font-medium text-yellow-800">Notes:</div>
                    <div className="text-yellow-700">{currentInvoice.notes}</div>
                  </div>
                )}

                {/* Signature */}
                <div className="text-right border-t pt-4">
                  <div className="inline-block border-t border-gray-400 pt-2">
                    {shopSettings.signature}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={copyInvoiceToClipboard}
                    className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Copier la facture
                  </button>
                  
                  <button
                    onClick={() => {
                      // Essayer d'imprimer sur mobile (fonctionne sur certains navigateurs)
                      window.print();
                    }}
                    className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <FileText size={20} />
                    Imprimer/Partager
                  </button>
                  
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Fermer
                  </button>
                </div>

                {/* Instructions pour mobile */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>💡 Astuce :</strong> Après avoir copié, vous pouvez :
                  </p>
                  <ul className="text-xs text-blue-600 mt-1 space-y-1">
                    <li>• Coller dans WhatsApp pour partager</li>
                    <li>• Coller dans l'application Notes</li>
                    <li>• Envoyer par SMS ou email</li>
                    <li>• Sauvegarder pour plus tard</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={`bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg ${
          darkMode ? "from-gray-800 to-gray-900" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">📱 {shopSettings.name}</h1>
            <p className="text-blue-100">
              Gestionnaire de Commandes Professionnel
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition"
              title="Déconnexion"
            >
              <span>🚪</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div
        className={`${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } shadow-sm border-b`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {["dashboard", "orders", "clients", "analytics"].map((view) => (
              <button
                key={view}
                onClick={() => {
                  setCurrentView(view);
                  setShowForm(false);
                  setEditingOrder(null);
                  setShowItemForm(false);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentView === view
                    ? darkMode
                      ? "bg-blue-900 text-blue-100"
                      : "bg-blue-100 text-blue-700"
                    : darkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {view === "dashboard" && "📊 Tableau de bord"}
                {view === "orders" && "📦 Commandes"}
                {view === "clients" && "👥 Clients"}
                {view === "analytics" && "📈 Analytics"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Tableau de bord */}
        {currentView === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Commandes",
                  value: stats.total,
                  icon: Package,
                  color: "blue",
                },
                {
                  label: "En attente",
                  value: stats.pending,
                  icon: Package,
                  color: "orange",
                },
                {
                  label: "Payées",
                  value: stats.paid,
                  icon: DollarSign,
                  color: "green",
                },
                {
                  label: "Chiffre d'affaires",
                  value: `${stats.revenue.toLocaleString()} F`,
                  icon: DollarSign,
                  color: "blue",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`${cardClasses} p-6 rounded-xl shadow-sm border`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {stat.label}
                      </p>
                      <p
                        className={`text-3xl font-bold mt-1 ${
                          darkMode
                            ? "text-white"
                            : stat.color === "orange"
                            ? "text-orange-600"
                            : stat.color === "green"
                            ? "text-green-600"
                            : "text-gray-800"
                        }`}
                      >
                        {stat.value}
                      </p>
                    </div>
                    <stat.icon
                      className={
                        stat.color === "orange"
                          ? "text-orange-500"
                          : stat.color === "green"
                          ? "text-green-500"
                          : "text-blue-500"
                      }
                      size={32}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className={`${cardClasses} rounded-xl shadow-sm border p-6`}>
                <h3 className="text-xl font-bold mb-4">Revenus récents</h3>
                <div className="space-y-2">
                  {Object.entries(stats.revenueByDay)
                    .slice(0, 7)
                    .map(([date, revenue]) => (
                      <div
                        key={date}
                        className="flex justify-between items-center"
                      >
                        <span
                          className={
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }
                        >
                          {date}
                        </span>
                        <span className="font-bold text-green-600">
                          {revenue.toLocaleString()} F
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className={`${cardClasses} rounded-xl shadow-sm border p-6`}>
                <h3 className="text-xl font-bold mb-4">Meilleurs clients</h3>
                <div className="space-y-3">
                  {stats.topClients.map((client) => (
                    <div
                      key={client.id}
                      className={`p-3 rounded-lg ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{client.name}</p>
                          <p
                            className={`text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {client.totalOrders} commande
                            {client.totalOrders > 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className="font-bold text-blue-600">
                          {client.totalSpent.toLocaleString()} F
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vue Commandes */}
        {currentView === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold">
                Toutes les commandes ({orders.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                <div
                  className={`relative rounded-lg border ${
                    darkMode ? "border-gray-700" : "border-gray-300"
                  }`}
                >
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="delivered">Livré</option>
                </select>
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Export Excel</span>
                </button>
                <button
                  onClick={handleStartOrder}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 hover:bg-blue-700 transition shadow-md"
                >
                  <Plus size={20} />
                  <span>Nouvelle commande</span>
                </button>
              </div>
            </div>

            {/* Formulaire responsive */}
            {showForm && !showItemForm && (
              <div className={`${cardClasses} rounded-xl shadow-lg border p-6`}>
                <h3 className="text-xl font-bold mb-4">
                  {editingOrder
                    ? "Modifier la commande"
                    : "Nouvelle commande - Étape 1/2"}
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Combien d'articles souhaitez-vous ajouter ? *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={itemCount}
                      onChange={(e) => setItemCount(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                      placeholder="Ex: 3"
                    />
                    <p
                      className={`text-sm mt-2 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Entrez le nombre total d'articles différents pour cette
                      commande (1-50)
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={confirmItemCount}
                      disabled={!itemCount}
                      className={`flex-1 py-3 rounded-lg font-semibold transition shadow-md ${
                        itemCount
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Continuer vers les articles →
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingOrder(null);
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showForm && showItemForm && (
              <div
                className={`${cardClasses} rounded-xl shadow-lg border p-4 md:p-6`}
              >
                <h3 className="text-xl font-bold mb-4">
                  {editingOrder
                    ? "Modifier la commande"
                    : "Nouvelle commande - Étape 2/2"}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-semibold mb-2">
                        Nom du client *
                      </label>
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientName: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 md:px-4 md:py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                        placeholder="Ex: Marie Dupont"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-semibold mb-2">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={formData.clientPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientPhone: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 md:px-4 md:py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                        placeholder="Ex: 699123456"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-semibold mb-2">
                        Adresse *
                      </label>
                      <input
                        type="text"
                        value={formData.clientAddress}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientAddress: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 md:px-4 md:py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                        placeholder="Ex: Akwa, Douala"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className={`w-full px-3 py-2 md:px-4 md:py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                      placeholder="Notes supplémentaires..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold">
                        Articles ({formData.items.length} article
                        {formData.items.length > 1 ? "s" : ""})
                      </label>
                      <button
                        type="button"
                        onClick={addItem}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center space-x-1"
                      >
                        <Plus size={16} />
                        <span>Ajouter article</span>
                      </button>
                    </div>
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-2 items-start"
                      >
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(index, "name", e.target.value)
                          }
                          className={`flex-1 w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                          placeholder={`Nom de l'article ${index + 1}`}
                        />
                        <div className="flex gap-2 w-full sm:w-auto">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", e.target.value)
                            }
                            className="w-16 px-2 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Qté"
                          />
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(index, "price", e.target.value)
                            }
                            className="w-24 px-2 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Prix"
                          />
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`p-3 md:p-4 rounded-lg ${
                      darkMode ? "bg-blue-900" : "bg-blue-50"
                    }`}
                  >
                    <p
                      className={`text-lg font-bold ${
                        darkMode ? "text-blue-300" : "text-blue-800"
                      }`}
                    >
                      Total: {calculateTotal(formData.items).toLocaleString()}{" "}
                      FCFA
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                    >
                      {editingOrder
                        ? "Mettre à jour"
                        : "Enregistrer la commande"}
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setShowItemForm(false);
                        setEditingOrder(null);
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des commandes */}
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div
                  className={`${cardClasses} rounded-xl shadow-sm border p-12 text-center`}
                >
                  <Package size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">
                    Aucune commande trouvée
                  </p>
                  <p className="text-gray-400 mt-2">
                    Ajustez vos filtres ou créez une nouvelle commande
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`${cardClasses} rounded-xl shadow-sm border p-6`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">
                          {order.clientName}
                        </h3>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {order.clientPhone} • {order.clientAddress}
                        </p>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          } mt-1`}
                        >
                          {new Date(order.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {order.notes && (
                          <p
                            className={`text-sm mt-2 p-2 rounded-lg ${
                              darkMode
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <strong>Note:</strong> {order.notes}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div
                      className={`rounded-lg p-4 mb-4 ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm py-1"
                        >
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                          <span className="font-semibold">
                            {(item.quantity * item.price).toLocaleString()} FCFA
                          </span>
                        </div>
                      ))}
                      <div
                        className={`border-t mt-2 pt-2 flex justify-between font-bold ${
                          darkMode ? "border-gray-600" : "border-gray-200"
                        }`}
                      >
                        <span>TOTAL</span>
                        <span className="text-blue-600">
                          {order.total.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as 'pending' | 'paid' | 'delivered')}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                      >
                        <option value="pending">En attente</option>
                        <option value="paid">Payé</option>
                        <option value="delivered">Livré</option>
                      </select>
                      <button
                        onClick={() => editOrder(order)}
                        className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                          darkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Edit2 size={16} />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => generateInvoice(order)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                      >
                        <Download size={16} />
                        <span>Facture</span>
                      </button>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Vue Clients */}
        {currentView === "clients" && (
          <div className={`${cardClasses} rounded-xl shadow-sm border p-6`}>
            <h2 className="text-2xl font-bold mb-6">
              Gestion des Clients ({clients.length})
            </h2>
            <div className="space-y-4">
              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <User size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Aucun client enregistré</p>
                </div>
              ) : (
                clients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-4 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{client.name}</h3>
                        <p
                          className={
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          {client.phone}
                        </p>
                        <p
                          className={
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          {client.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          {client.totalSpent.toLocaleString()} FCFA
                        </p>
                        <p
                          className={
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }
                        >
                          {client.totalOrders} commande
                          {client.totalOrders > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Vue Analytics */}
        {currentView === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Taux de Conversion",
                  value: `${stats.conversionRate}%`,
                  icon: BarChart3,
                  color: "green",
                },
                {
                  label: "Panier Moyen",
                  value: `${Math.round(
                    stats.averageOrderValue
                  ).toLocaleString()} F`,
                  icon: DollarSign,
                  color: "blue",
                },
                {
                  label: "Revenus Hebdo",
                  value: `${stats.weeklyRevenue.toLocaleString()} F`,
                  icon: Package,
                  color: "orange",
                },
                {
                  label: "Clients Actifs",
                  value: clients.length,
                  icon: Users,
                  color: "purple",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`${cardClasses} p-6 rounded-xl shadow-sm border`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {stat.label}
                      </p>
                      <p
                        className={`text-2xl font-bold mt-1 ${
                          darkMode
                            ? "text-white"
                            : stat.color === "orange"
                            ? "text-orange-600"
                            : stat.color === "green"
                            ? "text-green-600"
                            : stat.color === "purple"
                            ? "text-purple-600"
                            : "text-blue-600"
                        }`}
                      >
                        {stat.value}
                      </p>
                    </div>
                    <stat.icon
                      className={
                        stat.color === "orange"
                          ? "text-orange-500"
                          : stat.color === "green"
                          ? "text-green-500"
                          : stat.color === "purple"
                          ? "text-purple-500"
                          : "text-blue-500"
                      }
                      size={32}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className={`${cardClasses} rounded-xl shadow-sm border p-6`}>
                <h3 className="text-xl font-bold mb-4">
                  Articles les Plus Vendus
                </h3>
                <div className="space-y-3">
                  {stats.topItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Aucune donnée disponible
                    </p>
                  ) : (
                    stats.topItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 rounded-lg bg-gray-50 bg-opacity-50"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-blue-600">
                          {(item.quantity as number)} vendus
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={`${cardClasses} rounded-xl shadow-sm border p-6`}>
                <h3 className="text-xl font-bold mb-4">
                  Répartition des Statuts
                </h3>
                <div className="space-y-4">
                  {Object.entries(stats.ordersByStatus).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="flex justify-between items-center"
                      >
                        <span className="capitalize">
                          {status === "pending"
                            ? "En attente"
                            : status === "paid"
                            ? "Payées"
                            : "Livrées"}
                        </span>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                status === "pending"
                                  ? "bg-orange-500"
                                  : status === "paid"
                                  ? "bg-green-500"
                                  : "bg-blue-500"
                              }`}
                              style={{
                                width: `${(count / stats.total) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="font-bold w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal des paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${cardClasses} rounded-xl shadow-2xl max-w-md w-full p-6`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Paramètres de la boutique</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Nom de la boutique
                </label>
                <input
                  type="text"
                  value={shopSettings.name}
                  onChange={(e) =>
                    setShopSettings({ ...shopSettings, name: e.target.value })
                  }
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={shopSettings.phone}
                  onChange={(e) =>
                    setShopSettings({ ...shopSettings, phone: e.target.value })
                  }
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={shopSettings.address}
                  onChange={(e) =>
                    setShopSettings({
                      ...shopSettings,
                      address: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Signature
                </label>
                <input
                  type="text"
                  value={shopSettings.signature}
                  onChange={(e) =>
                    setShopSettings({
                      ...shopSettings,
                      signature: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                />
              </div>

              <button
                onClick={async () => {
                  await saveSettingsToFirebase(shopSettings);
                  setShowSettings(false);
                  alert("Paramètres sauvegardés !");
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className={`${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-t mt-8`}
      ></div>
    </div>
  );
};

export default OrderManagerDemo;