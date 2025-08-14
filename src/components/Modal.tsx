import React, { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from "react";

type Component<P extends {}> = React.FunctionComponent<P>;

type Modal<P extends {}> = {
  show: (props?: Omit<P, "hide">) => void;
  hide: () => void;
};

type ModalProps<K extends {}> = K & {
  hide: () => void;
};

type Modals = Array<{
  component: Component<any>;
  props: { key: string };
}>;

type ModalContextType = <P extends {}>(Modal: Component<ModalProps<P>>) => Modal<P>;

type ModalProviderPropsType = {
  children: React.ReactNode;
};

type ModalRef = (callback: (modals: Modals) => Modals) => void;

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider: React.FC<ModalProviderPropsType> = ({ children }) => {
  const serialNumber = useRef(0);
  // @ts-ignore: fix later
  const setModalRef = useRef<ModalRef>();

  const createModal = useCallback(<P extends {}>(component: Component<ModalProps<P>>) => {
    const key = `modal-${++serialNumber.current}`;

    const memoisedComponent = React.memo(component);

    function hide() {
      return setModalRef.current((modals) => {
        const idx = modals.findIndex((m) => m.props.key === key);
        if (idx === -1) return modals;
        return modals.filter((m) => m.props.key !== key);
      });
    }

    function show(props: P = {} as P) {
      return setModalRef.current((modals) => {
        // Don't need to to anything if the modal being shown is already the latest one
        if (modals.length !== 0 && modals[modals.length - 1].props.key === key) return modals;

        const newProps = Object.assign({ key, hide }, props);

        // Either add the modal to the end of the queue or make sure it's at the end of the queue
        return modals.filter((m) => m.props.key !== key).concat({ component: memoisedComponent, props: newProps });
      });
    }

    return { show, hide };
  }, []);

  return (
    // @ts-ignore: fix later
    <ModalContext.Provider value={createModal}>
      {children}
      <ModalState modalRef={setModalRef} />
    </ModalContext.Provider>
  );
};

function ModalState({ modalRef }: { modalRef: React.MutableRefObject<ModalRef> }) {
  const [modals, setModals] = useState<Modals>([]);
  modalRef.current = setModals;
  return (
    <>
      {modals.map(({ component, props }) => {
        return createElement(component, props);
      })}
    </>
  );
}

export function useModal<P extends {}>(component: Component<ModalProps<P>>): Modal<P> {
  // @ts-ignore: fix later
  const modal = useRef<Modal<P>>();
  const createModal = useContext(ModalContext);

  if (!modal.current) {
    // @ts-ignore: fix later
    modal.current = createModal(component);
  }

  // Make sure the modal is removed when the parent component unmounts
  useEffect(() => modal.current.hide, []);

  return modal.current;
}
