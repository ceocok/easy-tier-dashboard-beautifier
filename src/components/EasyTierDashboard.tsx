import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Globe, 
  Link, 
  Clock, 
  ArrowDownUp, 
  Shield,
  Wifi,
  Server,
  Download,
  Upload,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';

interface Node {
  virtual_ip: string;
  public_addr: string;
  cost: string;
  latency_ms: number;
  rx_bytes: number;
  tx_bytes: number;
  conn_type: string;
}

const API_URL = 'http://118.31.43.162:4000/api/nodes';
const REFRESH_INTERVAL = 10000;

const EasyTierDashboard: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const createStatusBadge = (cost: string) => {
    const mode = (cost || 'unknown').toLowerCase();
    if (mode.includes('local')) {
      return <Badge variant="secondary" className="bg-primary/10 text-primary"><Wifi className="w-3 h-3 mr-1" /> 本地连接</Badge>;
    }
    if (mode.includes('p2p')) {
      return <Badge variant="secondary" className="bg-success/10 text-success"><Link className="w-3 h-3 mr-1" /> P2P 直连</Badge>;
    }
    if (mode.includes('relay')) {
      return <Badge variant="secondary" className="bg-warning/10 text-warning"><Server className="w-3 h-3 mr-1" /> 中继转发</Badge>;
    }
    return <Badge variant="outline">{cost || '-'}</Badge>;
  };

  const formatToMB = (bytes: number): string => {
    if (!bytes) return '0.00';
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  const fetchNodes = async () => {
    try {
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(API_URL, { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API 响应错误: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`后端错误: ${data.details || data.error}`);
      }
      
      setNodes(data);
      setLastUpdate(new Date());
      setLoading(false);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      setLoading(false);
      toast({
        title: "连接失败",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchNodes();
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">EasyTier Pro Dashboard</h1>
              <p className="text-muted-foreground">网络节点监控与管理</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              onClick={handleRefresh} 
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${error ? 'bg-destructive' : 'bg-success animate-pulse'}`} />
                <span className="text-sm font-medium">
                  {error ? '连接异常' : `在线节点: ${nodes.length}`}
                </span>
              </div>
              {lastUpdate && (
                <span className="text-sm text-muted-foreground">
                  上次更新: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">无法连接到后端服务</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                重试连接
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">正在加载节点数据...</p>
            </CardContent>
          </Card>
        ) : nodes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">未发现任何在线节点</h3>
              <p className="text-muted-foreground">请检查网络连接和节点配置</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                网络节点状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          虚拟 IP
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          主机名
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Link className="w-4 h-4" />
                          连接模式
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          延迟 (ms)
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <ArrowDownUp className="w-4 h-4" />
                          接收/发送 (MB)
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          隧道协议
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map((node, index) => {
                      const cleanIp = (node.virtual_ip || '').split('/')[0];
                      const latency = node.latency_ms > 0 ? node.latency_ms.toFixed(1) : '-';
                      const rxMb = formatToMB(node.rx_bytes);
                      const txMb = formatToMB(node.tx_bytes);

                      return (
                        <tr 
                          key={index} 
                          className="border-b hover:bg-muted/50 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <td className="py-4 px-4">
                            <span className="font-mono font-semibold text-primary">
                              {cleanIp}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium">
                              {node.public_addr || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {createStatusBadge(node.cost)}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-mono">
                              {latency}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3 font-mono text-sm">
                              <div className="flex items-center gap-1 text-success">
                                <Download className="w-3 h-3" />
                                {rxMb}
                              </div>
                              <span className="text-muted-foreground">/</span>
                              <div className="flex items-center gap-1 text-primary">
                                <Upload className="w-3 h-3" />
                                {txMb}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline">
                              {node.conn_type || '-'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EasyTierDashboard;