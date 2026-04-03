import { useState, useEffect } from 'react';
import styles from '../AdminPanel.module.scss';
import type { Procurement } from '../types';
import { api } from '../../../api/api';

export const ProcurementsManager: React.FC = () => {
    const [procurements, setProcurements] = useState<Procurement[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProcurement, setEditingProcurement] = useState<Procurement | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        number: '',
        contractNumber: '',
        supplier: '',
        type: 'goods', // товар
        method: 'direct', // прямой
        status: 'active' as 'active' | 'completed' | 'cancelled',
        date: '',
        amount: ''
    });

    useEffect(() => {
        loadProcurements();
    }, []);

    const loadProcurements = async () => {
        try {
            setLoading(true);
            const data = await api.getProcurements();
            setProcurements(data);
        } catch (error) {
            console.error('Ошибка загрузки закупок:', error);
            setProcurements([]);
        } finally {
            setLoading(false);
        }
    };

    // Конфигурация типов закупки
    const typeOptions = [
        { value: 'goods', label: 'Товар' },
        { value: 'services', label: 'Услуга' },
        { value: 'works', label: 'Работа' }
    ];

    // Конфигурация методов закупки
    const methodOptions = [
        { value: 'direct', label: 'Прямое заключение договора' },
        { value: 'quotation', label: 'Запрос котировок' },
        { value: 'simple', label: 'Простейшая закупка' }
    ];

    const getTypeLabel = (type: string) => {
        const option = typeOptions.find(opt => opt.value === type);
        return option ? option.label : type;
    };

    const getMethodLabel = (method: string) => {
        const option = methodOptions.find(opt => opt.value === method);
        return option ? option.label : method;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.number || !formData.contractNumber || !formData.supplier || !formData.type || !formData.method || !formData.date || !formData.amount) {
            alert('Заполните все обязательные поля');
            return;
        }

        const amountNumber = parseFloat(formData.amount.replace(/\s/g, ''));
        if (isNaN(amountNumber) || amountNumber <= 0) {
            alert('Введите корректную сумму (положительное число)');
            return;
        }

        const procurementData = {
            number: formData.number,
            contractNumber: formData.contractNumber,
            supplier: formData.supplier,
            type: formData.type,
            method: formData.method,
            status: formData.status,
            date: formData.date,
            amount: amountNumber,
        };

        console.log('Отправляемые данные:', procurementData);

        setIsSaving(true);
        
        try {
            if (editingProcurement) {
                await api.updateProcurement(editingProcurement.id, procurementData);
                alert('✅ Закупка успешно обновлена!');
            } else {
                await api.createProcurement(procurementData);
                alert('✅ Закупка успешно добавлена!');
            }
            
            await loadProcurements();
            setIsModalOpen(false);
            resetForm();
        } catch (error: any) {
            console.error('Ошибка сохранения:', error);
            alert('❌ Ошибка при сохранении закупки');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setEditingProcurement(null);
        setFormData({
            number: '',
            contractNumber: '',
            supplier: '',
            type: 'goods',
            method: 'direct',
            status: 'active',
            date: '',
            amount: ''
        });
    };

    const handleEdit = (proc: Procurement) => {
        setEditingProcurement(proc);
        setFormData({
            number: proc.number || '',
            contractNumber: proc.contractNumber || '',
            supplier: proc.supplier || '',
            type: proc.type || 'goods',
            method: proc.method || 'direct',
            status: proc.status || 'active',
            date: proc.date || '',
            amount: proc.amount?.toString() || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Вы уверены, что хотите удалить эту закупку?')) {
            try {
                await api.deleteProcurement(id);
                await loadProcurements();
                alert('✅ Закупка успешно удалена!');
            } catch (error) {
                console.error('Ошибка удаления:', error);
                alert('❌ Ошибка при удалении закупки');
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <span className={styles.statusActive}>Активна</span>;
            case 'completed': return <span className={styles.statusCompleted}>Завершена</span>;
            case 'cancelled': return <span className={styles.statusCancelled}>Отменена</span>;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className={styles.manager}>
                <div className={styles.managerHeader}>
                    <h2>Управление закупками</h2>
                    <button className={styles.addBtn}>+ Добавить закупку</button>
                </div>
                <div className={styles.tableWrapper}>
                    <div className={styles.loaderContainer}>
                        <div className={styles.loader}></div>
                        <p>Загрузка закупок...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.manager}>
            <div className={styles.managerHeader}>
                <h2>Управление закупками</h2>
                <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
                    + Добавить закупку
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>№ Контракта</th>
                            <th>Поставщик</th>
                            <th>Тип</th>
                            <th>Метод</th>
                            <th>Статус</th>
                            <th>Дата</th>
                            <th>Сумма</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {procurements.map(proc => (
                            <tr key={proc.id}>
                                <td>{proc.number || '-'}</td>
                                <td>{proc.contractNumber || '-'}</td>
                                <td>{proc.supplier || '-'}</td>
                                <td>{getTypeLabel(proc.type)}</td>
                                <td>{getMethodLabel(proc.method)}</td>
                                <td>{getStatusBadge(proc.status)}</td>
                                <td>{proc.date ? new Date(proc.date).toLocaleDateString('ru-RU') : '-'}</td>
                                <td>{proc.amount ? proc.amount.toLocaleString() : '0'} сом</td>
                                <td>
                                    <button onClick={() => handleEdit(proc)} className={styles.editBtn}>
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => proc.id && handleDelete(proc.id)} 
                                        className={styles.deleteBtn}
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {procurements.length === 0 && (
                            <tr>
                                <td colSpan={9} className={styles.emptyCell}>
                                    Нет добавленных закупок
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>{editingProcurement ? 'Редактировать закупку' : 'Добавить закупку'}</h3>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Номер"
                                value={formData.number}
                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="№ Контракта"
                                value={formData.contractNumber}
                                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Поставщик"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                required
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    required
                                    style={{ flex: 1 }}
                                >
                                    {typeOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <select
                                    value={formData.method}
                                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                    required
                                    style={{ flex: 1 }}
                                >
                                    {methodOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' | 'cancelled' })}
                                required
                            >
                                <option value="active">Активна</option>
                                <option value="completed">Завершена</option>
                                <option value="cancelled">Отменена</option>
                            </select>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Сумма договора (цифрами)"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className={styles.cancelBtn}
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};