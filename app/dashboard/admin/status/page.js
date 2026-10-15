  async function load(id) {
    const code = (id || '').trim()
    if (!code) return
    setLoading(true)
    setNotFound(false)
    setOrder(null)
    setMsg(null)

    const upper = code.toUpperCase()

    // 1) Tenta por ID (QR code usa o id completo)
    if (code.includes('-')) {
      const { data: o } = await supabase
        .from('orders')
        .select('*')
        .eq('id', code)
        .maybeSingle()
      if (o) {
        setOrder(o)
        setLoading(false)
        return
      }
    }

    // 2) Tenta por order_number exato (aceita maiúscula/minúscula)
    const { data: o2 } = await supabase
      .from('orders')
      .select('*')
      .ilike('order_number', upper)
      .maybeSingle()
    if (o2) {
      setOrder(o2)
      setLoading(false)
      return
    }

    // 3) Última tentativa: começa com o código digitado (bipes às vezes truncam)
    const { data: o3 } = await supabase
      .from('orders')
      .select('*')
      .ilike('order_number', `${upper}%`)
      .limit(2)
    if (o3 && o3.length === 1) {
      setOrder(o3[0])
      setLoading(false)
      return
    }

    setNotFound(true)
    setLoading(false)
  }
