from dataclasses import dataclass, field
from typing import Optional

@dataclass
class TuringMachine:
    """
    Motor de la Máquina de Turing.
    La 'lógica spaghetti' está encapsulada en la tabla de transición:
    delta[estado_actual][símbolo_leído] = (nuevo_estado, símbolo_escribir, dirección)
    """
    tape: list[str]
    transitions: dict  # { estado: { símbolo: (nuevo_estado, escribir, dirección) } }
    initial_state: str
    accept_states: set[str]
    reject_states: set[str]
    blank: str = "_"

    head: int = field(default=0, init=False)
    current_state: str = field(default="", init=False)
    history: list[dict] = field(default_factory=list, init=False)
    steps: int = field(default=0, init=False)

    def __post_init__(self):
        self.current_state = self.initial_state
        self.tape = list(self.tape) + [self.blank] * 10  # extiende cinta

    def step(self) -> dict:
        """Ejecuta UN paso de la máquina y retorna el estado actual."""
        symbol = self.tape[self.head] if self.head < len(self.tape) else self.blank
        
        # Lógica spaghetti: la máquina salta de estado a estado según la tabla
        if self.current_state not in self.transitions:
            return self._snapshot("HALT_NO_TRANSITION")
        if symbol not in self.transitions[self.current_state]:
            return self._snapshot("HALT_NO_SYMBOL")

        new_state, write_symbol, direction = self.transitions[self.current_state][symbol]
        
        # Escribe en la cinta
        self.tape[self.head] = write_symbol
        # Mueve el cabezal
        self.head += 1 if direction == "R" else -1
        self.head = max(0, self.head)
        # Cambia de estado (el "goto" de la lógica spaghetti)
        self.current_state = new_state
        self.steps += 1

        snapshot = self._snapshot("RUNNING")
        self.history.append(snapshot)
        return snapshot

    def run(self, max_steps: int = 1000) -> dict:
        """Ejecuta hasta aceptar, rechazar o llegar al límite."""
        while self.steps < max_steps:
            if self.current_state in self.accept_states:
                return self._snapshot("ACCEPTED")
            if self.current_state in self.reject_states:
                return self._snapshot("REJECTED")
            result = self.step()
            if result["status"].startswith("HALT"):
                return result
        return self._snapshot("MAX_STEPS_REACHED")

    def _snapshot(self, status: str) -> dict:
        return {
            "status": status,
            "state": self.current_state,
            "tape": list(self.tape),
            "head": self.head,
            "step": self.steps,
        }