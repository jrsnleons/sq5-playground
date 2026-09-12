import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../simulationStore';
import { safeStorage } from '../../services/localCache';

describe('Cable Tracing, Disambiguation, and Connection Editing', () => {
  beforeEach(() => {
    safeStorage.clear();
    // Reset store to fresh default simulation state
    useSimulationStore.getState().resetCurrentPreset();
  });

  it('correctly locks trace by exact cableId when multiple cables share socket in-1', () => {
    const store = useSimulationStore.getState();

    // Find all cables that connect to an in-1 port on different nodes
    const in1Cables = store.sim.physical.cables.filter((c) => c.toPort === 'in-1');
    expect(in1Cables.length).toBeGreaterThanOrEqual(2);

    const firstCable = in1Cables[0];
    const secondCable = in1Cables[1];

    // Lock trace explicitly to secondCable using cableId
    store.setLockedTrace(secondCable.toPort, secondCable.toNode, secondCable.id);

    const activeTrace = useSimulationStore.getState().activeTrace;
    expect(activeTrace).not.toBeNull();
    expect(activeTrace?.cableId).toBe(secondCable.id);
    expect(activeTrace?.cableId).not.toBe(firstCable.id);
  });

  it('disambiguates trace lookup by (socketId, nodeId) when cableId is not provided', () => {
    const store = useSimulationStore.getState();

    const in1Cables = store.sim.physical.cables.filter((c) => c.toPort === 'in-1');
    expect(in1Cables.length).toBeGreaterThanOrEqual(2);

    const targetCable = in1Cables[1];

    // Lookup using socketId and nodeId without cableId
    store.setLockedTrace(targetCable.toPort, targetCable.toNode);

    const activeTrace = useSimulationStore.getState().activeTrace;
    expect(activeTrace).not.toBeNull();
    expect(activeTrace?.cableId).toBe(targetCable.id);
    expect(activeTrace?.nodeId).toBe(targetCable.toNode);
  });

  it('toggles trace off when clicking the same active trace again', () => {
    const store = useSimulationStore.getState();
    const cable = store.sim.physical.cables[0];

    store.setLockedTrace(cable.toPort, cable.toNode, cable.id);
    expect(useSimulationStore.getState().activeTrace?.cableId).toBe(cable.id);

    // Click again to toggle off
    store.setLockedTrace(cable.toPort, cable.toNode, cable.id);
    expect(useSimulationStore.getState().activeTrace).toBeNull();
  });

  it('updates cable signalType via updateCableSignalType', () => {
    const store = useSimulationStore.getState();
    const cable = store.sim.physical.cables.find((c) => c.id === 'cable-keys-di') || store.sim.physical.cables[0];

    expect(cable).toBeDefined();

    store.updateCableSignalType(cable.id, 'instrument');

    const updated = useSimulationStore.getState().sim.physical.cables.find((c) => c.id === cable.id);
    expect(updated?.signalType).toBe('instrument');
  });

  it('auto-orients cable direction when connecting from input port to output port', () => {
    const store = useSimulationStore.getState();

    const testItemId = 'test-guitar';
    const testDiId = 'test-di';

    useSimulationStore.setState((state) => {
      state.sim.physical.stageItems.push(
        {
          id: testItemId,
          typeId: 'custom-guitar',
          name: 'Test Guitar',
          category: 'instrument',
          position: { x: 0, y: 0 }
        },
        {
          id: testDiId,
          typeId: 'custom-di',
          name: 'Test DI',
          category: 'di-box',
          position: { x: 100, y: 0 }
        }
      );
    });

    // Connect from DI input (in-1) to guitar output (out-1) in reverse order
    const connected = store.connectCable(testDiId, 'in-1', testItemId, 'out-1', 'instrument');
    expect(connected).toBe(true);

    const createdCable = useSimulationStore
      .getState()
      .sim.physical.cables.find((c) => c.fromNode === testItemId && c.toNode === testDiId);

    expect(createdCable).toBeDefined();
    expect(createdCable?.fromPort).toBe('out-1');
    expect(createdCable?.toPort).toBe('in-1');
    expect(createdCable?.signalType).toBe('instrument');
  });

  it('removes only the targeted cable and clears activeTrace if it was traced', () => {
    const store = useSimulationStore.getState();
    const initialCount = store.sim.physical.cables.length;

    // Pick two distinct cables
    const cableA = store.sim.physical.cables[0];
    const cableB = store.sim.physical.cables[1];

    // Lock trace to cableA
    store.setLockedTrace(cableA.toPort, cableA.toNode, cableA.id);
    expect(useSimulationStore.getState().activeTrace?.cableId).toBe(cableA.id);

    // Remove cableA
    store.removeCable(cableA.id);

    const stateAfterA = useSimulationStore.getState();
    expect(stateAfterA.sim.physical.cables.length).toBe(initialCount - 1);
    expect(stateAfterA.sim.physical.cables.some((c) => c.id === cableA.id)).toBe(false);
    expect(stateAfterA.sim.physical.cables.some((c) => c.id === cableB.id)).toBe(true);
    expect(stateAfterA.activeTrace).toBeNull();
  });
});
