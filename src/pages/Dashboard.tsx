import { useState, useEffect } from 'react';
import { Package, ShieldCheck, Activity } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import './Dashboard.css';
import type { DashboardMetrics } from '../types';
import { dataService } from '../services/dataService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProducts: 0,
    totalResguardos: 0,
    totalTransactions: 0
  });

  const [productsByCondition, setProductsByCondition] = useState<any[]>([]);
  const [transactionsTrend, setTransactionsTrend] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [products, resguardos, temps] = await Promise.all([
          dataService.getProducts(),
          dataService.getResguardos(),
          dataService.getTemporaryEquipments()
        ]);

        setMetrics({ 
          totalProducts: products.length, 
          totalResguardos: resguardos.length, 
          totalTransactions: temps.length 
        });

        // Prepare data for conditional pie chart
        const conditionCounts: Record<string, number> = {};
        products.forEach(p => {
          const cond = p.condition || 'No Especificado';
          conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
        });
        const pieData = Object.keys(conditionCounts).map(key => ({
          name: key,
          value: conditionCounts[key]
        }));
        setProductsByCondition(pieData);

        // Prepare data for transactions line chart (last 7 days logic simplified to grouped by date)
        const dateCounts: Record<string, number> = {};
        // Sort temporary loans oldest to newest
        const sortedTemps = [...temps].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Get last 10 entries for brevity in chart
        sortedTemps.forEach(t => {
          const dateStr = new Date(t.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
          dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
        });
        
        let lineData = Object.keys(dateCounts).map(date => ({
          date,
          movimientos: dateCounts[date]
        }));
        // keep only the last 14 days of activity to prevent overcrowding
        if(lineData.length > 14) lineData = lineData.slice(lineData.length - 14);
        setTransactionsTrend(lineData);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Metrics Grid */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-title">Total de Equipos</span>
            <span className="metric-value">{metrics.totalProducts}</span>
          </div>
          <div className="metric-icon-wrapper primary">
            <Package size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-title">Resguardos Generados</span>
            <span className="metric-value">{metrics.totalResguardos}</span>
          </div>
          <div className="metric-icon-wrapper success">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-title">Préstamos Temporales</span>
            <span className="metric-value">{metrics.totalTransactions}</span>
          </div>
          <div className="metric-icon-wrapper warning">
            <Activity size={24} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Gráfica 1: Historial Movimientos */}
        <div className="dashboard-section" style={{ minHeight: '350px' }}>
          <div className="section-header">
            <h3 className="section-title">Actividad de Préstamos Temporales</h3>
          </div>
          {transactionsTrend.length === 0 ? (
            <div className="empty-state" style={{ height: '250px' }}>
              <Activity size={48} className="empty-state-icon" />
              <p>No hay datos suficientes para graficar.</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transactionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="movimientos" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Gráfica 2: Estado de Equipos */}
        <div className="dashboard-section" style={{ minHeight: '350px' }}>
          <div className="section-header">
            <h3 className="section-title">Estado Físico de Equipos</h3>
          </div>
          {productsByCondition.length === 0 ? (
            <div className="empty-state" style={{ height: '250px' }}>
              <Package size={48} className="empty-state-icon" />
              <p>No hay equipos registrados aún.</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productsByCondition}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {productsByCondition.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
