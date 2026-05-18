import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

// Simple platform check to adjust localhost URL
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/agents/process' : 'http://localhost:3000/api/agents/process';

export default function HomeScreen() {
  const [inputText, setInputText] = useState('Due to severe weather in Shenzhen, factory output is halted. All shipments from Supplier X are delayed by 14 days.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [trace, setTrace] = useState<any[]>([]);
  const [stateBefore, setStateBefore] = useState<any[]>([]);
  const [stateAfter, setStateAfter] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runPipeline = async () => {
    setIsProcessing(true);
    setTrace([]);
    setStateBefore([]);
    setStateAfter([]);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unstructuredText: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
         setError(data.error || 'Pipeline failed');
         if (data.trace) setTrace(data.trace);
         return;
      }

      setTrace(data.trace);
      setStateBefore(data.system_state?.before || []);
      setStateAfter(data.system_state?.after || []);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Antigravity Agent</Text>
      <Text style={styles.subheader}>Insight → Action Pipeline</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Unstructured Data Input</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Paste email, news, or report here..."
        />
        <TouchableOpacity 
          style={[styles.button, isProcessing && styles.buttonDisabled]} 
          onPress={runPipeline} 
          disabled={isProcessing}
        >
          {isProcessing ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.buttonText}>Execute Agentic Workflow</Text>
          )}
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Agent Orchestration Trace</Text>
        {trace.length === 0 && <Text style={styles.emptyText}>Waiting for execution...</Text>}
        {trace.map((step, idx) => (
          <View key={idx} style={styles.traceStep}>
            <View style={styles.traceHeader}>
              <Text style={styles.agentName}>{step.agent}</Text>
              <Text style={[
                styles.agentStatus, 
                step.status === 'Completed' ? styles.statusCompleted : styles.statusRunning
              ]}>
                {step.status}
              </Text>
            </View>
            {step.details && <Text style={styles.traceDetails}>{step.details}</Text>}
          </View>
        ))}
      </View>

      {stateAfter.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Simulated System Outcome</Text>
          {stateAfter.map((p: any) => {
             const beforeItem = stateBefore.find((b: any) => b.id === p.id);
             const changedStatus = p.status !== beforeItem?.status;
             const changedDate = p.nextShipmentDate !== beforeItem?.nextShipmentDate;
             
             return (
              <View key={p.id} style={[styles.inventoryItem, (changedStatus || changedDate) && styles.inventoryItemChanged]}>
                <Text style={styles.productName}>{p.name}</Text>
                <Text>Stock: {p.stock}</Text>
                <Text style={changedDate ? styles.textChanged : null}>Shipment: {p.nextShipmentDate}</Text>
                <Text style={changedStatus ? styles.textChanged : null}>Status: {p.status}</Text>
              </View>
             );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1d4ed8',
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    marginTop: 8,
    fontSize: 14,
  },
  emptyText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  traceStep: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  traceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  agentName: {
    fontWeight: 'bold',
    color: '#1e40af',
  },
  agentStatus: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusRunning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  traceDetails: {
    color: '#4b5563',
    fontSize: 13,
  },
  inventoryItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  inventoryItemChanged: {
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    borderBottomWidth: 0,
    marginBottom: 6,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  textChanged: {
    color: '#dc2626',
    fontWeight: 'bold',
  }
});
