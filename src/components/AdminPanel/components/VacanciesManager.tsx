import { useState, useEffect } from 'react';
import styles from '../AdminPanel.module.scss';
import type { Vacancy } from '../types';
import { api } from '../../../api/api';

export const VacanciesManager: React.FC = () => {
    const [vacancies, setVacancies] = useState<Vacancy[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        salaryFrom: '',
        salaryTo: '',
        schedule: '',
        experience: '',
        description: '',
        requirements: '',
        responsibilities: '',
        conditions: '',
        status: 'open' as 'open' | 'closed',
        publishedAt: ''
    });

    useEffect(() => {
        loadVacancies();
    }, []);

    const loadVacancies = async () => {
        try {
            setLoading(true);
            const data = await api.getVacancies();
            setVacancies(data);
        } catch (error) {
            console.error('Ошибка загрузки вакансий:', error);
            setVacancies([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const vacancyData: Vacancy = {
            id: editingVacancy?.id || Date.now().toString(),
            title: formData.title,
            salaryFrom: formData.salaryFrom,
            salaryTo: formData.salaryTo,
            schedule: formData.schedule,
            experience: formData.experience,
            description: formData.description,
            requirements: formData.requirements.split('\n').filter(r => r.trim()),
            responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
            conditions: formData.conditions.split('\n').filter(c => c.trim()),
            status: formData.status,
            publishedAt: formData.publishedAt,
            createdAt: editingVacancy?.createdAt || new Date().toISOString()
        };

        setIsSaving(true);
        
        try {
            if (editingVacancy) {
                await api.updateVacancy(editingVacancy.id, vacancyData);
                alert('✅ Вакансия успешно обновлена!');
            } else {
                await api.createVacancy(vacancyData);
                alert('✅ Вакансия успешно добавлена!');
            }
            
            await loadVacancies();
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('❌ Ошибка при сохранении вакансии');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setEditingVacancy(null);
        setFormData({
            title: '',
            salaryFrom: '',
            salaryTo: '',
            schedule: '',
            experience: '',
            description: '',
            requirements: '',
            responsibilities: '',
            conditions: '',
            status: 'open',
            publishedAt: ''
        });
    };

    const handleEdit = (vacancy: Vacancy) => {
        setEditingVacancy(vacancy);
        setFormData({
            title: vacancy.title,
            salaryFrom: vacancy.salaryFrom,
            salaryTo: vacancy.salaryTo,
            schedule: vacancy.schedule,
            experience: vacancy.experience,
            description: vacancy.description,
            requirements: vacancy.requirements.join('\n'),
            responsibilities: vacancy.responsibilities.join('\n'),
            conditions: vacancy.conditions.join('\n'),
            status: vacancy.status,
            publishedAt: vacancy.publishedAt
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Вы уверены, что хотите удалить эту вакансию?')) {
            try {
                await api.deleteVacancy(id);
                await loadVacancies();
                alert('✅ Вакансия успешно удалена!');
            } catch (error) {
                console.error('Ошибка удаления:', error);
                alert('❌ Ошибка при удалении вакансии');
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <span className={styles.statusActive}>Открыта</span>;
            case 'closed': return <span className={styles.statusCancelled}>Закрыта</span>;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className={styles.manager}>
                <div className={styles.managerHeader}>
                    <h2>Управление вакансиями</h2>
                    <button className={styles.addBtn}>+ Добавить вакансию</button>
                </div>
                <div className={styles.tableWrapper}>
                    <div className={styles.loaderContainer}>
                        <div className={styles.loader}></div>
                        <p>Загрузка вакансий...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.manager}>
            <div className={styles.managerHeader}>
                <h2>Управление вакансиями</h2>
                <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
                    + Добавить вакансию
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Зарплата</th>
                            <th>График</th>
                            <th>Опыт</th>
                            <th>Статус</th>
                            <th>Дата</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vacancies.map(vacancy => (
                            <tr key={vacancy.id}>
                                <td>{vacancy.title}</td>
                                <td>{vacancy.salaryFrom} - {vacancy.salaryTo} сом</td>
                                <td>{vacancy.schedule}</td>
                                <td>{vacancy.experience}</td>
                                <td>{getStatusBadge(vacancy.status)}</td>
                                <td>{new Date(vacancy.publishedAt).toLocaleDateString('ru-RU')}</td>
                                <td>
                                    <button onClick={() => handleEdit(vacancy)} className={styles.editBtn}>
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDelete(vacancy.id)} className={styles.deleteBtn}>
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {vacancies.length === 0 && (
                            <tr>
                                <td colSpan={7} className={styles.emptyCell}>
                                    Нет добавленных вакансий
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>{editingVacancy ? 'Редактировать вакансию' : 'Добавить вакансию'}</h3>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Название вакансии"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input
                                    type="text"
                                    placeholder="Зарплата от"
                                    value={formData.salaryFrom}
                                    onChange={(e) => setFormData({ ...formData, salaryFrom: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Зарплата до"
                                    value={formData.salaryTo}
                                    onChange={(e) => setFormData({ ...formData, salaryTo: e.target.value })}
                                    required
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="График работы"
                                value={formData.schedule}
                                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Требуемый опыт"
                                value={formData.experience}
                                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Описание вакансии"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                required
                            />
                            <textarea
                                placeholder="Требования (каждое требование с новой строки)"
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                rows={3}
                            />
                            <textarea
                                placeholder="Обязанности (каждая обязанность с новой строки)"
                                value={formData.responsibilities}
                                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                                rows={3}
                            />
                            <textarea
                                placeholder="Условия работы (каждое условие с новой строки)"
                                value={formData.conditions}
                                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                                rows={3}
                            />
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'open' | 'closed' })}
                            >
                                <option value="open">Открыта</option>
                                <option value="closed">Закрыта</option>
                            </select>
                            <input
                                type="date"
                                placeholder="Дата публикации"
                                value={formData.publishedAt}
                                onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
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