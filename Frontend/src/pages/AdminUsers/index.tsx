import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Table, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input, Container, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../lib/axios';
import SearchBar from '../../components/SearchBar';
import SortSelector, { SortOption } from '../../components/SortSelector';
import PaginationComponent from '../../components/Pagination';
import scopes from '../../data/users/scopes';
import styles from './styles.module.scss';

// Trainer interfaces
interface Trainer {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: {
      name?: string;
      scope?: string | string[];
    };
    address?: string;
    country?: string;
    taxNumber?: number;
  };
  bio?: string;
  specialties?: string[];
  isValidated: boolean;
  isActive?: boolean;
  phone?: string;
  createdAt: string;
}

interface TrainerFormData {
  name: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  specialties?: string;
  scope?: string;
}

// Client interfaces
interface Client {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: {
      name?: string;
      scope?: string | string[];
    };
    address?: string;
    country?: string;
    taxNumber?: number;
  };
  trainerId?: {
    _id: string;
    userId?: {
      name: string;
      email: string;
    };
  };
  heightCm?: number;
  weightKg?: number;
  goal?: string;
  notes?: string;
  isValidated?: boolean;
  createdAt: string;
}

interface ClientFormData {
  name: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  country?: string;
  taxNumber?: string;
  heightCm?: string;
  weightKg?: string;
  goal?: string;
  notes?: string;
  trainerId?: string;
  scope?: string;
}

const AdminUsers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trainers' | 'clients'>('trainers');
  
  // Trainer states
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [trainerModalOpen, setTrainerModalOpen] = useState(false);
  const [editTrainerModalOpen, setEditTrainerModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [submittingTrainer, setSubmittingTrainer] = useState(false);
  const [trainerSearchTerm, setTrainerSearchTerm] = useState('');
  const [trainerSortBy, setTrainerSortBy] = useState('-createdAt');
  const [trainerFormData, setTrainerFormData] = useState<TrainerFormData>({
    name: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    specialties: '',
    scope: scopes.PersonalTrainer,
  });
  const [trainerPagination, setTrainerPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Client states
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submittingClient, setSubmittingClient] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSortBy, setClientSortBy] = useState('-createdAt');
  const [clientFormData, setClientFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    country: '',
    taxNumber: '',
    heightCm: '',
    weightKg: '',
    goal: '',
    notes: '',
    trainerId: '',
    scope: scopes.Client,
  });
  const [clientPagination, setClientPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [availableTrainers, setAvailableTrainers] = useState<Trainer[]>([]);

  // Fetch trainers
  const fetchTrainers = async (page = 1) => {
    setLoadingTrainers(true);
    try {
      const skip = (page - 1) * trainerPagination.pageSize;
      const response = await apiClient.get('/trainers', {
        params: { limit: trainerPagination.pageSize, skip },
      });

      const trainersList = response.data.success && response.data.data 
        ? response.data.data 
        : [];
      const total = response.data.meta?.pagination?.total || 0;

      setAllTrainers(trainersList);
      setTrainerPagination({
        ...trainerPagination,
        current: page,
        total: total,
      });
    } catch (error: any) {
      console.error('Error fetching trainers:', error);
      toast.error('Erro ao carregar treinadores', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoadingTrainers(false);
    }
  };

  // Fetch clients
  const fetchClients = async (page = 1) => {
    setLoadingClients(true);
    try {
      const skip = (page - 1) * clientPagination.pageSize;
      const response = await apiClient.get('/clients', {
        params: { limit: clientPagination.pageSize, skip },
      });

      const clientsList = response.data.success && response.data.data 
        ? response.data.data 
        : [];
      const total = response.data.meta?.pagination?.total || 0;

      setAllClients(clientsList);
      setClientPagination({
        ...clientPagination,
        current: page,
        total: total,
      });
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trainers') {
      fetchTrainers(1);
    } else {
      fetchClients(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Apply search and sort filters for trainers
  useEffect(() => {
    if (activeTab !== 'trainers') return;
    
    let filtered = [...allTrainers];

    if (trainerSearchTerm) {
      const term = trainerSearchTerm.toLowerCase();
      filtered = filtered.filter((trainer) => {
        const name = trainer.userId?.name?.toLowerCase() || '';
        const email = trainer.userId?.email?.toLowerCase() || '';
        const bio = trainer.bio?.toLowerCase() || '';
        const specialties = trainer.specialties?.join(' ').toLowerCase() || '';
        return name.includes(term) || email.includes(term) || bio.includes(term) || specialties.includes(term);
      });
    }

    filtered.sort((a, b) => {
      let aValue: string, bValue: string;
      
      if (trainerSortBy.includes('name')) {
        aValue = a.userId?.name || '';
        bValue = b.userId?.name || '';
      } else if (trainerSortBy.includes('email')) {
        aValue = a.userId?.email || '';
        bValue = b.userId?.email || '';
      } else if (trainerSortBy.includes('createdAt')) {
        aValue = a.createdAt || '';
        bValue = b.createdAt || '';
      } else {
        aValue = '';
        bValue = '';
      }

      if (trainerSortBy.startsWith('-')) {
        return bValue.localeCompare(aValue);
      }
      return aValue.localeCompare(bValue);
    });

    setTrainers(filtered);
    setTrainerPagination(prev => ({ ...prev, current: 1 }));
  }, [allTrainers, trainerSearchTerm, trainerSortBy, activeTab]);

  // Apply search and sort filters for clients
  useEffect(() => {
    if (activeTab !== 'clients') return;
    
    let filtered = [...allClients];

    if (clientSearchTerm) {
      const term = clientSearchTerm.toLowerCase();
      filtered = filtered.filter((client) => {
        const name = client.userId?.name?.toLowerCase() || '';
        const email = client.userId?.email?.toLowerCase() || '';
        const goal = client.goal?.toLowerCase() || '';
        const trainerName = client.trainerId?.userId?.name?.toLowerCase() || '';
        return name.includes(term) || email.includes(term) || goal.includes(term) || trainerName.includes(term);
      });
    }

    filtered.sort((a, b) => {
      let aValue: string, bValue: string;
      
      if (clientSortBy.includes('name')) {
        aValue = a.userId?.name || '';
        bValue = b.userId?.name || '';
      } else if (clientSortBy.includes('email')) {
        aValue = a.userId?.email || '';
        bValue = b.userId?.email || '';
      } else if (clientSortBy.includes('createdAt')) {
        aValue = a.createdAt || '';
        bValue = b.createdAt || '';
      } else {
        aValue = '';
        bValue = '';
      }

      if (clientSortBy.startsWith('-')) {
        return bValue.localeCompare(aValue);
      }
      return aValue.localeCompare(bValue);
    });

    setClients(filtered);
    setClientPagination(prev => ({ ...prev, current: 1 }));
  }, [allClients, clientSearchTerm, clientSortBy, activeTab]);

  const trainerSortOptions: SortOption[] = [
    { value: '-createdAt', label: 'Mais Recentes' },
    { value: 'createdAt', label: 'Mais Antigos' },
    { value: 'name', label: 'Nome (A-Z)' },
    { value: '-name', label: 'Nome (Z-A)' },
    { value: 'email', label: 'Email (A-Z)' },
    { value: '-email', label: 'Email (Z-A)' },
  ];

  const clientSortOptions: SortOption[] = [
    { value: '-createdAt', label: 'Mais Recentes' },
    { value: 'createdAt', label: 'Mais Antigos' },
    { value: 'name', label: 'Nome (A-Z)' },
    { value: '-name', label: 'Nome (Z-A)' },
    { value: 'email', label: 'Email (A-Z)' },
    { value: '-email', label: 'Email (Z-A)' },
  ];

  // Trainer pagination
  const trainerTotalPages = Math.ceil(trainers.length / trainerPagination.pageSize);
  const paginatedTrainers = useMemo(() => {
    return trainers.slice(
      (trainerPagination.current - 1) * trainerPagination.pageSize,
      trainerPagination.current * trainerPagination.pageSize
    );
  }, [trainers, trainerPagination.current, trainerPagination.pageSize]);

  // Client pagination
  const clientTotalPages = Math.ceil(clients.length / clientPagination.pageSize);
  const paginatedClients = useMemo(() => {
    return clients.slice(
      (clientPagination.current - 1) * clientPagination.pageSize,
      clientPagination.current * clientPagination.pageSize
    );
  }, [clients, clientPagination.current, clientPagination.pageSize]);

  // Trainer handlers
  const handleTrainerPageChange = (page: number) => {
    setTrainerPagination(prev => ({ ...prev, current: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleValidateTrainer = async (trainerId: string) => {
    try {
      await apiClient.put(`/trainers/${trainerId}`, { isValidated: true });
      fetchTrainers(trainerPagination.current);
      toast.success('Treinador validado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error validating trainer:', error);
      const errorMessage = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Erro ao validar treinador. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

  const handleToggleTrainerActive = async (trainerId: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/trainers/${trainerId}`, { isActive: !currentStatus });
      fetchTrainers(trainerPagination.current);
      toast.success(`Treinador ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error toggling trainer status:', error);
      const errorMessage = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Erro ao atualizar status do treinador. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

  const handleTrainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTrainer(true);

    try {
      const userData = {
        name: trainerFormData.name,
        email: trainerFormData.email,
        password: trainerFormData.password,
        firstName: trainerFormData.firstName || undefined,
        lastName: trainerFormData.lastName || undefined,
        phone: trainerFormData.phone || undefined,
        role: {
          name: 'PersonalTrainer',
          scope: ['PersonalTrainer'],
        },
      };

      const userResponse = await apiClient.post('/users', userData);
      const userId = userResponse.data?.user?._id || userResponse.data?._id;
      
      if (!userId) {
        throw new Error('Failed to create user: No user ID returned');
      }

      const trainerData = {
        userId: userId,
        bio: trainerFormData.bio || undefined,
        specialties: trainerFormData.specialties
          ? trainerFormData.specialties.split(',').map((s) => s.trim())
          : undefined,
        phone: trainerFormData.phone || undefined,
        isValidated: true,
      };

      await apiClient.post('/trainers', trainerData);
      await fetchTrainers(trainerPagination.current);
      toggleTrainerModal();
      toast.success('Treinador criado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error creating trainer:', error);
      const errorMessage = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Erro ao criar treinador. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setSubmittingTrainer(false);
    }
  };

  const handleTrainerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;

    setSubmittingTrainer(true);

    try {
      const trainerData: any = {
        bio: trainerFormData.bio || undefined,
        specialties: trainerFormData.specialties
          ? trainerFormData.specialties.split(',').map((s) => s.trim())
          : undefined,
        phone: trainerFormData.phone || undefined,
      };

      await apiClient.put(`/trainers/${editingTrainer._id}`, trainerData);

      const userUpdateData: any = {};
      if (trainerFormData.firstName !== editingTrainer.userId?.firstName) {
        userUpdateData.firstName = trainerFormData.firstName || undefined;
      }
      if (trainerFormData.lastName !== editingTrainer.userId?.lastName) {
        userUpdateData.lastName = trainerFormData.lastName || undefined;
      }
      if (trainerFormData.email !== editingTrainer.userId?.email) {
        userUpdateData.email = trainerFormData.email;
      }
      if (trainerFormData.name !== editingTrainer.userId?.name) {
        userUpdateData.name = trainerFormData.name;
      }
      if (trainerFormData.password) {
        userUpdateData.password = trainerFormData.password;
      }
      
      // Update role/scope if changed
      const currentScope = editingTrainer.userId?.role?.scope;
      const currentScopeValue = Array.isArray(currentScope) ? currentScope[0] : currentScope;
      if (trainerFormData.scope && trainerFormData.scope !== currentScopeValue) {
        userUpdateData.role = {
          name: trainerFormData.scope === scopes.PersonalTrainer ? 'PersonalTrainer' : 'client',
          scope: [trainerFormData.scope],
        };
      }

      if (Object.keys(userUpdateData).length > 0) {
        await apiClient.put(`/users/${editingTrainer.userId._id}`, userUpdateData);
      }

      await fetchTrainers(trainerPagination.current);
      toggleEditTrainerModal();
      toast.success('Treinador atualizado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error updating trainer:', error);
      const errorMessage = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Erro ao atualizar treinador. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setSubmittingTrainer(false);
    }
  };

  const toggleTrainerModal = () => {
    setTrainerModalOpen(!trainerModalOpen);
    if (!trainerModalOpen) {
      setTrainerFormData({
        name: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        bio: '',
        specialties: '',
        scope: scopes.PersonalTrainer,
      });
    }
  };

  const toggleEditTrainerModal = async (trainer?: Trainer) => {
    if (trainer) {
      try {
        const response = await apiClient.get(`/trainers/${trainer._id}`);
        const fullTrainer = response.data.success ? response.data.data : response.data;
        
        setEditingTrainer(fullTrainer);
        
        // Get current scope from user role
        const currentScope = fullTrainer.userId?.role?.scope;
        const currentScopeValue = Array.isArray(currentScope) ? currentScope[0] : currentScope;
        
        setTrainerFormData({
          name: fullTrainer.userId?.name || '',
          email: fullTrainer.userId?.email || '',
          password: '',
          firstName: fullTrainer.userId?.firstName || '',
          lastName: fullTrainer.userId?.lastName || '',
          phone: fullTrainer.phone || fullTrainer.userId?.phone || '',
          bio: fullTrainer.bio || '',
          specialties: fullTrainer.specialties?.join(', ') || '',
          scope: currentScopeValue || scopes.PersonalTrainer,
        });
      } catch (error) {
        console.error('Error fetching trainer data:', error);
        setEditingTrainer(trainer);
        
        // Get current scope from user role
        const currentScope = trainer.userId?.role?.scope;
        const currentScopeValue = Array.isArray(currentScope) ? currentScope[0] : currentScope;
        
        setTrainerFormData({
          name: trainer.userId?.name || '',
          email: trainer.userId?.email || '',
          password: '',
          firstName: trainer.userId?.firstName || '',
          lastName: trainer.userId?.lastName || '',
          phone: trainer.phone || trainer.userId?.phone || '',
          bio: trainer.bio || '',
          specialties: trainer.specialties?.join(', ') || '',
          scope: currentScopeValue || scopes.PersonalTrainer,
        });
      }
    } else {
      setEditingTrainer(null);
      setTrainerFormData({
        name: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        bio: '',
        specialties: '',
        scope: scopes.PersonalTrainer,
      });
    }
    setEditTrainerModalOpen(!editTrainerModalOpen);
  };

  // Client handlers
  const handleClientPageChange = (page: number) => {
    setClientPagination(prev => ({ ...prev, current: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleValidateClient = async (clientId: string) => {
    try {
      await apiClient.post(`/clients/${clientId}/validate`);
      fetchClients(clientPagination.current);
      toast.success('Cliente validado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error validating client:', error);
      const errorMessage = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Erro ao validar cliente. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingClient(true);

    try {
      const userData: any = {
        name: clientFormData.name,
        email: clientFormData.email,
        password: clientFormData.password,
        firstName: clientFormData.firstName || undefined,
        lastName: clientFormData.lastName || undefined,
        phone: clientFormData.phone || undefined,
        address: clientFormData.address || undefined,
        country: clientFormData.country || undefined,
        taxNumber: clientFormData.taxNumber ? parseInt(clientFormData.taxNumber) : undefined,
        role: {
          name: 'client',
          scope: ['client'],
        },
      };

      const userResponse = await apiClient.post('/users', userData);
      const userId = userResponse.data?.user?._id || userResponse.data?._id;
      
      if (!userId) {
        throw new Error('Failed to create user: No user ID returned');
      }

      const clientData: any = {
        userId: userId,
        goal: clientFormData.goal || undefined,
        notes: clientFormData.notes || undefined,
      };

      if (clientFormData.heightCm) {
        clientData.heightCm = parseFloat(clientFormData.heightCm);
      }
      if (clientFormData.weightKg) {
        clientData.weightKg = parseFloat(clientFormData.weightKg);
      }

      await apiClient.post('/clients', clientData);
      await fetchClients(clientPagination.current);
      toggleClientModal();
      toast.success('Cliente criado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error creating client:', error);
      const errorMessage = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Erro ao criar cliente. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setSubmittingClient(false);
    }
  };

  const handleClientEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setSubmittingClient(true);

    try {
      const clientData: any = {
        goal: clientFormData.goal || undefined,
        notes: clientFormData.notes || undefined,
      };

      if (clientFormData.heightCm) {
        clientData.heightCm = parseFloat(clientFormData.heightCm);
      }
      if (clientFormData.weightKg) {
        clientData.weightKg = parseFloat(clientFormData.weightKg);
      }

      // Add trainerId if selected
      if (clientFormData.trainerId) {
        clientData.trainerId = clientFormData.trainerId;
      } else {
        // If empty string, set to null to remove trainer assignment
        clientData.trainerId = null;
      }

      await apiClient.put(`/clients/${editingClient._id}`, clientData);

      const userUpdateData: any = {};
      if (clientFormData.firstName !== editingClient.userId?.firstName) {
        userUpdateData.firstName = clientFormData.firstName || undefined;
      }
      if (clientFormData.lastName !== editingClient.userId?.lastName) {
        userUpdateData.lastName = clientFormData.lastName || undefined;
      }
      if (clientFormData.email !== editingClient.userId?.email) {
        userUpdateData.email = clientFormData.email;
      }
      if (clientFormData.name !== editingClient.userId?.name) {
        userUpdateData.name = clientFormData.name;
      }
      if (clientFormData.password) {
        userUpdateData.password = clientFormData.password;
      }
      
      // Update role/scope if changed
      const currentScope = editingClient.userId?.role?.scope;
      const currentScopeValue = Array.isArray(currentScope) ? currentScope[0] : currentScope;
      if (clientFormData.scope && clientFormData.scope !== currentScopeValue) {
        userUpdateData.role = {
          name: clientFormData.scope === scopes.Client ? 'client' : 'PersonalTrainer',
          scope: [clientFormData.scope],
        };
      }

      if (Object.keys(userUpdateData).length > 0) {
        await apiClient.put(`/users/${editingClient.userId._id}`, userUpdateData);
      }

      await fetchClients(clientPagination.current);
      toggleEditClientModal();
      toast.success('Cliente atualizado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error updating client:', error);
      const errorMessage = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Erro ao atualizar cliente. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setSubmittingClient(false);
    }
  };

  const toggleClientModal = () => {
    setClientModalOpen(!clientModalOpen);
    if (!clientModalOpen) {
      setClientFormData({
        name: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        country: '',
        taxNumber: '',
        heightCm: '',
        weightKg: '',
        goal: '',
        notes: '',
        trainerId: '',
      });
    }
  };

  // Fetch all trainers for the select dropdown
  const fetchAllTrainers = async () => {
    try {
      console.log('Fetching all trainers...');
      const response = await apiClient.get('/trainers', {
        params: { limit: 1000, skip: 0 },
      });
      
      console.log('Trainers API response:', response.data);
      
      // Handle different response formats
      let trainersList = [];
      if (response.data.success && response.data.data) {
        // New modular format: { success: true, data: [...], meta: {...} }
        trainersList = response.data.data;
        console.log('Using new format, found', trainersList.length, 'trainers');
      } else if (response.data.trainers) {
        // Legacy format: { auth: true, trainers: [...], pagination: {...} }
        trainersList = response.data.trainers;
        console.log('Using legacy format, found', trainersList.length, 'trainers');
      } else if (Array.isArray(response.data)) {
        // Direct array
        trainersList = response.data;
        console.log('Using direct array format, found', trainersList.length, 'trainers');
      } else {
        console.warn('Unexpected response format:', response.data);
      }
      
      console.log('Setting available trainers:', trainersList.length);
      setAvailableTrainers(trainersList);
    } catch (error: any) {
      console.error('Error fetching trainers:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setAvailableTrainers([]);
    }
  };

  const toggleEditClientModal = async (client?: Client) => {
    // Fetch all trainers when opening the modal
    await fetchAllTrainers();
    
    if (client) {
      try {
        const response = await apiClient.get(`/clients/${client._id}`);
        const fullClient = response.data.success ? response.data.data : response.data;
        
        setEditingClient(fullClient);
        
        // Get trainerId - can be object or string
        const trainerId = fullClient.trainerId 
          ? (typeof fullClient.trainerId === 'object' ? fullClient.trainerId._id : fullClient.trainerId)
          : '';
        
        // Get current scope from user role
        const currentScope = fullClient.userId?.role?.scope;
        const currentScopeValue = Array.isArray(currentScope) ? currentScope[0] : currentScope;
        
        setClientFormData({
          name: fullClient.userId?.name || '',
          email: fullClient.userId?.email || '',
          password: '',
          firstName: fullClient.userId?.firstName || '',
          lastName: fullClient.userId?.lastName || '',
          phone: fullClient.userId?.phone || '',
          address: fullClient.userId?.address || '',
          country: fullClient.userId?.country || '',
          taxNumber: fullClient.userId?.taxNumber?.toString() || '',
          heightCm: fullClient.heightCm?.toString() || '',
          weightKg: fullClient.weightKg?.toString() || '',
          goal: fullClient.goal || '',
          notes: fullClient.notes || '',
          trainerId: trainerId || '',
          scope: currentScopeValue || scopes.Client,
        });
      } catch (error) {
        console.error('Error fetching client data:', error);
        setEditingClient(client);
        
        // Get trainerId - can be object or string
        const trainerId = client.trainerId 
          ? (typeof client.trainerId === 'object' ? client.trainerId._id : client.trainerId)
          : '';
        
        // Get current scope from user role
        const currentScope = client.userId?.role?.scope;
        const currentScopeValue = Array.isArray(currentScope) ? currentScope[0] : currentScope;
        
        setClientFormData({
          name: client.userId?.name || '',
          email: client.userId?.email || '',
          password: '',
          firstName: client.userId?.firstName || '',
          lastName: client.userId?.lastName || '',
          phone: client.userId?.phone || '',
          address: client.userId?.address || '',
          country: client.userId?.country || '',
          taxNumber: client.userId?.taxNumber?.toString() || '',
          heightCm: client.heightCm?.toString() || '',
          weightKg: client.weightKg?.toString() || '',
          goal: client.goal || '',
          notes: client.notes || '',
          trainerId: trainerId || '',
          scope: currentScopeValue || scopes.Client,
        });
      }
    } else {
      setEditingClient(null);
      setClientFormData({
        name: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        country: '',
        taxNumber: '',
        heightCm: '',
        weightKg: '',
        goal: '',
        notes: '',
        trainerId: '',
        scope: scopes.Client,
      });
    }
    setEditClientModalOpen(!editClientModalOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, type: 'trainer' | 'client') => {
    const { name, value } = e.target;
    if (type === 'trainer') {
      setTrainerFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setClientFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <Container className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Users Management</h1>
      </div>

      <Nav tabs className={styles.tabs}>
        <NavItem>
          <NavLink
            className={activeTab === 'trainers' ? styles.activeTab : ''}
            onClick={() => setActiveTab('trainers')}
            style={{ cursor: 'pointer' }}
          >
            Trainers
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === 'clients' ? styles.activeTab : ''}
            onClick={() => setActiveTab('clients')}
            style={{ cursor: 'pointer' }}
          >
            Clients
          </NavLink>
        </NavItem>
      </Nav>

      <TabContent activeTab={activeTab}>
        <TabPane tabId="trainers">
          <div className={styles.tabContent}>
            <div className={styles.header}>
              <h2>Trainers</h2>
              <Button className={styles.addButton} onClick={toggleTrainerModal}>
                <span>+</span> Add Trainer
              </Button>
            </div>

            <Row className="mb-3 mt-3">
              <Col md={6}>
                <SearchBar
                  value={trainerSearchTerm}
                  onChange={setTrainerSearchTerm}
                  placeholder="Pesquisar por nome ou email"
                  onClear={() => setTrainerSearchTerm('')}
                />
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <SortSelector
                  value={trainerSortBy}
                  onChange={setTrainerSortBy}
                  options={trainerSortOptions}
                  label="Ordenar por:"
                />
              </Col>
            </Row>

            {loadingTrainers && trainers.length === 0 ? (
              <div className={styles.loadingContainer}>
                <Spinner color="primary" />
              </div>
            ) : paginatedTrainers.length === 0 && allTrainers.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No trainers found. Click "Add Trainer" to create a new trainer.</p>
              </div>
            ) : paginatedTrainers.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No trainers found matching your search criteria.</p>
              </div>
            ) : (
              <>
                <div className={styles.card}>
                  <div className={styles.tableWrapper}>
                    <Table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Validation</th>
                          <th>Active</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTrainers.map((trainer) => (
                          <tr key={trainer._id}>
                            <td className={styles.nameCell}>{trainer.userId?.name || 'N/A'}</td>
                            <td className={styles.emailCell}>{trainer.userId?.email || 'N/A'}</td>
                            <td>
                              {trainer.isValidated ? (
                                <span className={styles.badgeSuccess}>Validated</span>
                              ) : (
                                <span className={styles.badgeWarning}>Pending</span>
                              )}
                            </td>
                            <td>
                              {trainer.isActive !== false ? (
                                <span className={styles.badgeSuccess}>Active</span>
                              ) : (
                                <span className={styles.badgeSecondary}>Inactive</span>
                              )}
                            </td>
                            <td className={styles.actionsCell}>
                              {!trainer.isValidated && (
                                <button
                                  className={styles.validateButton}
                                  onClick={() => handleValidateTrainer(trainer._id)}
                                >
                                  Validate
                                </button>
                              )}
                              <button
                                className={styles.editButton}
                                onClick={() => toggleEditTrainerModal(trainer)}
                              >
                                Edit
                              </button>
                              <button
                                className={trainer.isActive !== false ? styles.deactivateButton : styles.activateButton}
                                onClick={() => handleToggleTrainerActive(trainer._id, trainer.isActive !== false)}
                              >
                                {trainer.isActive !== false ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>

                {trainers.length > 0 && (
                  <PaginationComponent
                    currentPage={trainerPagination.current}
                    totalPages={trainerTotalPages}
                    pageSize={trainerPagination.pageSize}
                    total={trainers.length}
                    onPageChange={handleTrainerPageChange}
                    showPageSize={true}
                    onPageSizeChange={(size) => {
                      setTrainerPagination(prev => ({ ...prev, pageSize: size, current: 1 }));
                    }}
                  />
                )}
              </>
            )}
          </div>
        </TabPane>

        <TabPane tabId="clients">
          <div className={styles.tabContent}>
            <div className={styles.header}>
              <h2>Clients</h2>
              <Button className={styles.addButton} onClick={toggleClientModal}>
                <span>+</span> Add Client
              </Button>
            </div>

            <Row className="mb-3 mt-3">
              <Col md={6}>
                <SearchBar
                  value={clientSearchTerm}
                  onChange={setClientSearchTerm}
                  placeholder="Pesquisar por nome, email ou treinador"
                  onClear={() => setClientSearchTerm('')}
                />
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <SortSelector
                  value={clientSortBy}
                  onChange={setClientSortBy}
                  options={clientSortOptions}
                  label="Ordenar por:"
                />
              </Col>
            </Row>

            {loadingClients && clients.length === 0 ? (
              <div className={styles.loadingContainer}>
                <Spinner color="primary" />
              </div>
            ) : paginatedClients.length === 0 && allClients.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No clients found. Click "Add Client" to create a new client.</p>
              </div>
            ) : paginatedClients.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No clients found matching your search criteria.</p>
              </div>
            ) : (
              <>
                <div className={styles.card}>
                  <div className={styles.tableWrapper}>
                    <Table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Trainer</th>
                          <th>Goal</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedClients.map((client) => (
                          <tr key={client._id}>
                            <td className={styles.nameCell}>{client.userId?.name || 'N/A'}</td>
                            <td className={styles.emailCell}>{client.userId?.email || 'N/A'}</td>
                            <td>
                              {client.trainerId ? (
                                <span>
                                  {typeof client.trainerId === 'object' && client.trainerId !== null
                                    ? (client.trainerId.userId?.name || client.trainerId.userId?.email || 'N/A')
                                    : 'N/A'}
                                </span>
                              ) : (
                                <span className={styles.badgeWarning}>No Trainer</span>
                              )}
                            </td>
                            <td>{client.goal || '-'}</td>
                            <td>
                              {client.isValidated ? (
                                <span className={styles.badgeSuccess}>Validated</span>
                              ) : (
                                <span className={styles.badgeWarning}>Pending</span>
                              )}
                            </td>
                            <td className={styles.actionsCell}>
                              {!client.isValidated && (
                                <button
                                  className={styles.validateButton}
                                  onClick={() => handleValidateClient(client._id)}
                                >
                                  Validate
                                </button>
                              )}
                              <button
                                className={styles.editButton}
                                onClick={() => toggleEditClientModal(client)}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>

                {clients.length > 0 && (
                  <PaginationComponent
                    currentPage={clientPagination.current}
                    totalPages={clientTotalPages}
                    pageSize={clientPagination.pageSize}
                    total={clients.length}
                    onPageChange={handleClientPageChange}
                    showPageSize={true}
                    onPageSizeChange={(size) => {
                      setClientPagination(prev => ({ ...prev, pageSize: size, current: 1 }));
                    }}
                  />
                )}
              </>
            )}
          </div>
        </TabPane>
      </TabContent>

      {/* Trainer Modals */}
      <Modal isOpen={trainerModalOpen} toggle={toggleTrainerModal} size="lg" className={styles.modal}>
        <ModalHeader toggle={toggleTrainerModal}>Add New Trainer</ModalHeader>
        <Form onSubmit={handleTrainerSubmit}>
          <ModalBody>
            <div className={styles.formGroup}>
              <Label for="new-trainer-name">Name *</Label>
              <Input
                type="text"
                name="name"
                id="new-trainer-name"
                value={trainerFormData.name}
                onChange={(e) => handleInputChange(e, 'trainer')}
                required
                placeholder="Username"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="new-trainer-email">Email *</Label>
              <Input
                type="email"
                name="email"
                id="new-trainer-email"
                value={trainerFormData.email}
                onChange={(e) => handleInputChange(e, 'trainer')}
                required
                placeholder="trainer@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="new-trainer-password">Password *</Label>
              <Input
                type="password"
                name="password"
                id="new-trainer-password"
                value={trainerFormData.password}
                onChange={(e) => handleInputChange(e, 'trainer')}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="new-trainer-firstName">First Name</Label>
                  <Input
                    type="text"
                    name="firstName"
                    id="new-trainer-firstName"
                    value={trainerFormData.firstName}
                    onChange={(e) => handleInputChange(e, 'trainer')}
                    placeholder="First name"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="new-trainer-lastName">Last Name</Label>
                  <Input
                    type="text"
                    name="lastName"
                    id="new-trainer-lastName"
                    value={trainerFormData.lastName}
                    onChange={(e) => handleInputChange(e, 'trainer')}
                    placeholder="Last name"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="new-trainer-phone">Phone</Label>
              <Input
                type="tel"
                name="phone"
                id="new-trainer-phone"
                value={trainerFormData.phone}
                onChange={(e) => handleInputChange(e, 'trainer')}
                placeholder="Phone number"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="new-trainer-bio">Bio</Label>
              <Input
                type="textarea"
                name="bio"
                id="new-trainer-bio"
                value={trainerFormData.bio}
                onChange={(e) => handleInputChange(e, 'trainer')}
                rows={3}
                placeholder="Trainer biography"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="new-trainer-specialties">Specialties</Label>
              <Input
                type="text"
                name="specialties"
                id="new-trainer-specialties"
                value={trainerFormData.specialties}
                onChange={(e) => handleInputChange(e, 'trainer')}
                placeholder="Comma-separated specialties (e.g., Strength, Cardio, Yoga)"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button className={styles.modalButtonSecondary} onClick={toggleTrainerModal} disabled={submittingTrainer}>
              Cancel
            </Button>
            <Button className={styles.modalButtonPrimary} type="submit" disabled={submittingTrainer}>
              {submittingTrainer ? 'Creating...' : 'Create Trainer'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={editTrainerModalOpen} toggle={() => toggleEditTrainerModal()} size="lg" className={styles.modal}>
        <ModalHeader toggle={() => toggleEditTrainerModal()}>Edit Trainer</ModalHeader>
        <Form onSubmit={handleTrainerEdit}>
          <ModalBody>
            <div className={styles.formGroup}>
              <Label for="edit-name">Name *</Label>
              <Input
                type="text"
                name="name"
                id="edit-name"
                value={trainerFormData.name}
                onChange={(e) => handleInputChange(e, 'trainer')}
                required
                placeholder="Username"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-email">Email *</Label>
              <Input
                type="email"
                name="email"
                id="edit-email"
                value={trainerFormData.email}
                onChange={(e) => handleInputChange(e, 'trainer')}
                required
                placeholder="trainer@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-password">Password</Label>
              <Input
                type="password"
                name="password"
                id="edit-password"
                value={trainerFormData.password}
                onChange={(e) => handleInputChange(e, 'trainer')}
                minLength={6}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="edit-firstName">First Name</Label>
                  <Input
                    type="text"
                    name="firstName"
                    id="edit-firstName"
                    value={trainerFormData.firstName}
                    onChange={(e) => handleInputChange(e, 'trainer')}
                    placeholder="First name"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="edit-lastName">Last Name</Label>
                  <Input
                    type="text"
                    name="lastName"
                    id="edit-lastName"
                    value={trainerFormData.lastName}
                    onChange={(e) => handleInputChange(e, 'trainer')}
                    placeholder="Last name"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="edit-phone">Phone</Label>
              <Input
                type="tel"
                name="phone"
                id="edit-phone"
                value={trainerFormData.phone}
                onChange={(e) => handleInputChange(e, 'trainer')}
                placeholder="Phone number"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-bio">Bio</Label>
              <Input
                type="textarea"
                name="bio"
                id="edit-bio"
                value={trainerFormData.bio}
                onChange={(e) => handleInputChange(e, 'trainer')}
                rows={3}
                placeholder="Trainer biography"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-specialties">Specialties</Label>
              <Input
                type="text"
                name="specialties"
                id="edit-specialties"
                value={trainerFormData.specialties}
                onChange={(e) => handleInputChange(e, 'trainer')}
                placeholder="Comma-separated specialties (e.g., Strength, Cardio, Yoga)"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button className={styles.modalButtonSecondary} onClick={() => toggleEditTrainerModal()} disabled={submittingTrainer}>
              Cancel
            </Button>
            <Button className={styles.modalButtonPrimary} type="submit" disabled={submittingTrainer}>
              {submittingTrainer ? 'Updating...' : 'Update Trainer'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Client Modals */}
      <Modal isOpen={clientModalOpen} toggle={toggleClientModal} size="lg" className={styles.modal}>
        <ModalHeader toggle={toggleClientModal}>Add New Client</ModalHeader>
        <Form onSubmit={handleClientSubmit}>
          <ModalBody>
            <div className={styles.formGroup}>
              <Label for="client-name">Name *</Label>
              <Input
                type="text"
                name="name"
                id="client-name"
                value={clientFormData.name}
                onChange={(e) => handleInputChange(e, 'client')}
                required
                placeholder="Username"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="client-email">Email *</Label>
              <Input
                type="email"
                name="email"
                id="client-email"
                value={clientFormData.email}
                onChange={(e) => handleInputChange(e, 'client')}
                required
                placeholder="client@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="client-password">Password *</Label>
              <Input
                type="password"
                name="password"
                id="client-password"
                value={clientFormData.password}
                onChange={(e) => handleInputChange(e, 'client')}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="client-firstName">First Name</Label>
                  <Input
                    type="text"
                    name="firstName"
                    id="client-firstName"
                    value={clientFormData.firstName}
                    onChange={(e) => handleInputChange(e, 'client')}
                    placeholder="First name"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="client-lastName">Last Name</Label>
                  <Input
                    type="text"
                    name="lastName"
                    id="client-lastName"
                    value={clientFormData.lastName}
                    onChange={(e) => handleInputChange(e, 'client')}
                    placeholder="Last name"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="client-phone">Phone</Label>
              <Input
                type="tel"
                name="phone"
                id="client-phone"
                value={clientFormData.phone}
                onChange={(e) => handleInputChange(e, 'client')}
                placeholder="Phone number"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="client-address">Address</Label>
                  <Input
                    type="text"
                    name="address"
                    id="client-address"
                    value={clientFormData.address}
                    onChange={(e) => handleInputChange(e, 'client')}
                    placeholder="Address"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="client-country">Country</Label>
                  <Input
                    type="text"
                    name="country"
                    id="client-country"
                    value={clientFormData.country}
                    onChange={(e) => handleInputChange(e, 'client')}
                    placeholder="Country"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="client-taxNumber">Tax Number</Label>
              <Input
                type="number"
                name="taxNumber"
                id="client-taxNumber"
                value={clientFormData.taxNumber}
                onChange={(e) => handleInputChange(e, 'client')}
                placeholder="Tax number"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="client-heightCm">Height (cm)</Label>
                  <Input
                    type="number"
                    name="heightCm"
                    id="client-heightCm"
                    value={clientFormData.heightCm}
                    onChange={(e) => handleInputChange(e, 'client')}
                    placeholder="Height in cm"
                    min="0"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="client-weightKg">Weight (kg)</Label>
                  <Input
                    type="number"
                    name="weightKg"
                    id="client-weightKg"
                    value={clientFormData.weightKg}
                    onChange={(e) => handleInputChange(e, 'client')}
                    placeholder="Weight in kg"
                    min="0"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="client-goal">Goal</Label>
              <Input
                type="text"
                name="goal"
                id="client-goal"
                value={clientFormData.goal}
                onChange={(e) => handleInputChange(e, 'client')}
                placeholder="Main goal (e.g., Lose weight, Gain muscle)"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="client-notes">Notes</Label>
              <Input
                type="textarea"
                name="notes"
                id="client-notes"
                value={clientFormData.notes}
                onChange={(e) => handleInputChange(e, 'client')}
                rows={3}
                placeholder="Additional notes about the client"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button className={styles.modalButtonSecondary} onClick={toggleClientModal} disabled={submittingClient}>
              Cancel
            </Button>
            <Button className={styles.modalButtonPrimary} type="submit" disabled={submittingClient}>
              {submittingClient ? 'Creating...' : 'Create Client'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={editClientModalOpen} toggle={() => toggleEditClientModal()} size="lg" className={styles.modal}>
        <ModalHeader toggle={() => toggleEditClientModal()}>Edit Client</ModalHeader>
        <Form onSubmit={handleClientEdit}>
          <ModalBody>
            <div className={styles.formGroup}>
              <Label for="edit-client-name">Name *</Label>
              <Input
                type="text"
                name="name"
                id="edit-client-name"
                value={clientFormData.name}
                onChange={(e) => handleInputChange(e, 'client')}
                required
                placeholder="Username"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-client-email">Email *</Label>
              <Input
                type="email"
                name="email"
                id="edit-client-email"
                value={clientFormData.email}
                onChange={(e) => handleInputChange(e, 'client')}
                required
                placeholder="client@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-client-password">Password</Label>
              <Input
                type="password"
                name="password"
                id="edit-client-password"
                value={clientFormData.password}
                onChange={(e) => handleInputChange(e, 'client')}
                minLength={6}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="edit-client-firstName">First Name</Label>
                  <Input
                    type="text"
                    name="firstName"
                    id="edit-client-firstName"
                    value={clientFormData.firstName}
                    onChange={(e) => handleInputChange(e, 'client')}
                    placeholder="First name"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="edit-client-lastName">Last Name</Label>
                  <Input
                    type="text"
                    name="lastName"
                    id="edit-client-lastName"
                    value={clientFormData.lastName}
                    onChange={(e) => handleInputChange(e, 'client')}
                    placeholder="Last name"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="edit-client-phone">Phone</Label>
              <Input
                type="tel"
                name="phone"
                id="edit-client-phone"
                value={clientFormData.phone}
                onChange={(e) => handleInputChange(e, 'client')}
                placeholder="Phone number"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="edit-client-heightCm">Height (cm)</Label>
                  <Input
                    type="number"
                    name="heightCm"
                    id="edit-client-heightCm"
                    value={clientFormData.heightCm}
                    onChange={(e) => handleInputChange(e, 'client')}
                    placeholder="Height in cm"
                    min="0"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="edit-client-weightKg">Weight (kg)</Label>
                  <Input
                    type="number"
                    name="weightKg"
                    id="edit-client-weightKg"
                    value={clientFormData.weightKg}
                    onChange={(e) => handleInputChange(e, 'client')}
                    placeholder="Weight in kg"
                    min="0"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="edit-client-goal">Goal</Label>
              <Input
                type="text"
                name="goal"
                id="edit-client-goal"
                value={clientFormData.goal}
                onChange={(e) => handleInputChange(e, 'client')}
                placeholder="Main goal (e.g., Lose weight, Gain muscle)"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-client-notes">Notes</Label>
              <Input
                type="textarea"
                name="notes"
                id="edit-client-notes"
                value={clientFormData.notes}
                onChange={(e) => handleInputChange(e, 'client')}
                rows={3}
                placeholder="Additional notes about the client"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-client-trainerId">Trainer</Label>
              <Input
                type="select"
                name="trainerId"
                id="edit-client-trainerId"
                value={clientFormData.trainerId || ''}
                onChange={(e) => handleInputChange(e, 'client')}
              >
                <option value="">Sem Treinador</option>
                {availableTrainers.length === 0 ? (
                  <option disabled>Carregando treinadores...</option>
                ) : (
                  availableTrainers
                    .map((trainer) => (
                      <option key={trainer._id} value={trainer._id}>
                        {trainer.userId?.name || trainer.userId?.email || 'N/A'}
                        {!trainer.isValidated ? ' (Não validado)' : ''}
                        {trainer.isActive === false ? ' (Inativo)' : ''}
                      </option>
                    ))
                )}
              </Input>
              <small className="text-muted">
                {availableTrainers.length === 0 
                  ? 'Carregando lista de treinadores...'
                  : `${availableTrainers.length} treinador(es) disponível(eis)`
                }
              </small>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button className={styles.modalButtonSecondary} onClick={() => toggleEditClientModal()} disabled={submittingClient}>
              Cancel
            </Button>
            <Button className={styles.modalButtonPrimary} type="submit" disabled={submittingClient}>
              {submittingClient ? 'Updating...' : 'Update Client'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminUsers;

