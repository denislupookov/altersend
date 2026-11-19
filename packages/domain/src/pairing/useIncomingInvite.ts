import { useEffect, useMemo, useRef, useState } from 'react'
import { declineInvite } from '../transfer/commands'
import { transferStore, useTransferStore } from '../transfer/store'
import type { IncomingInvite } from '../transfer/types'
import { canAutoAcceptInvite, type AutoAcceptStoragePort } from './autoAccept'

type InviteResponder = (invite: IncomingInvite) => void

interface UseIncomingInviteArgs {
  storage: AutoAcceptStoragePort
  onAccept: InviteResponder
  onAutoAccept?: InviteResponder
}

export interface IncomingInvitePrompt {
  invite: IncomingInvite | null
  accept: () => void
  decline: () => void
}

export function useIncomingInvite({
  storage,
  onAccept,
  onAutoAccept
}: UseIncomingInviteArgs): IncomingInvitePrompt {
  const incoming = useTransferStore((s) => s.remember.incomingInvite)
  const [answeredTopic, setAnsweredTopic] = useState<string | null>(null)
  const answeredTopicRef = useRef<string | null>(null)

  const unanswered = incoming && incoming.topic !== answeredTopic ? incoming : null
  const autoAcceptable = useMemo(
    () =>
      unanswered !== null &&
      canAutoAcceptInvite(transferStore.getState(), unanswered, storage.read()),
    [unanswered, storage]
  )
  const invite = autoAcceptable ? null : unanswered

  const answer = (pending: IncomingInvite, respond: InviteResponder) => {
    if (answeredTopicRef.current === pending.topic) return
    answeredTopicRef.current = pending.topic
    setAnsweredTopic(pending.topic)
    respond(pending)
  }

  const autoAccept = useRef(() => {})
  autoAccept.current = () => {
    if (unanswered) answer(unanswered, onAutoAccept ?? onAccept)
  }

  useEffect(() => {
    if (autoAcceptable) autoAccept.current()
  }, [autoAcceptable, unanswered])

  return {
    invite,
    accept: () => {
      if (invite) answer(invite, onAccept)
    },
    decline: () => {
      if (invite) answer(invite, declineInvite)
    }
  }
}
