export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string | null
          documento: string | null
          endereco: string | null
          id: string
          nascimento: string | null
          nome: string
          observacoes: string | null
          pontos: number
          telefone: string | null
          total_gasto: number
          ultima_compra: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          documento?: string | null
          endereco?: string | null
          id?: string
          nascimento?: string | null
          nome: string
          observacoes?: string | null
          pontos?: number
          telefone?: string | null
          total_gasto?: number
          ultima_compra?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          documento?: string | null
          endereco?: string | null
          id?: string
          nascimento?: string | null
          nome?: string
          observacoes?: string | null
          pontos?: number
          telefone?: string | null
          total_gasto?: number
          ultima_compra?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contas: {
        Row: {
          cliente: string | null
          created_at: string | null
          descricao: string
          fornecedor: string | null
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["account_status"]
          tipo: Database["public"]["Enums"]["account_type"]
          updated_at: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          cliente?: string | null
          created_at?: string | null
          descricao: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          tipo: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
          valor: number
          vencimento: string
        }
        Update: {
          cliente?: string | null
          created_at?: string | null
          descricao?: string
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          tipo?: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          categoria: string
          created_at: string | null
          data: string | null
          descricao: string
          id: string
          observacoes: string | null
          tipo: Database["public"]["Enums"]["entry_type"]
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data?: string | null
          descricao: string
          id?: string
          observacoes?: string | null
          tipo: Database["public"]["Enums"]["entry_type"]
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data?: string | null
          descricao?: string
          id?: string
          observacoes?: string | null
          tipo?: Database["public"]["Enums"]["entry_type"]
          valor?: number
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          contato: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          nif: string | null
          nome: string
          observacoes: string | null
          prazo_entrega: number | null
          telefone: string | null
          ultima_entrega: string | null
          updated_at: string | null
        }
        Insert: {
          contato?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nif?: string | null
          nome: string
          observacoes?: string | null
          prazo_entrega?: number | null
          telefone?: string | null
          ultima_entrega?: string | null
          updated_at?: string | null
        }
        Update: {
          contato?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nif?: string | null
          nome?: string
          observacoes?: string | null
          prazo_entrega?: number | null
          telefone?: string | null
          ultima_entrega?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lotes: {
        Row: {
          created_at: string | null
          fornecedor: string
          id: string
          lote: string
          product_id: string
          product_name: string
          quantidade: number
          validade: string
        }
        Insert: {
          created_at?: string | null
          fornecedor: string
          id?: string
          lote: string
          product_id: string
          product_name: string
          quantidade: number
          validade: string
        }
        Update: {
          created_at?: string | null
          fornecedor?: string
          id?: string
          lote?: string
          product_id?: string
          product_name?: string
          quantidade?: number
          validade?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cat: string
          cod: string
          created_at: string | null
          custo: number
          est: number
          id: string
          min: number
          nome: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          cat: string
          cod: string
          created_at?: string | null
          custo?: number
          est?: number
          id?: string
          min?: number
          nome: string
          preco?: number
          updated_at?: string | null
        }
        Update: {
          cat?: string
          cod?: string
          created_at?: string | null
          custo?: number
          est?: number
          id?: string
          min?: number
          nome?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_initials: string
          cargo: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_initials?: string
          cargo?: string
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_initials?: string
          cargo?: string
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          cod: string
          desconto: number
          desconto_tipo: string
          id: string
          nome: string
          preco: number
          product_id: string
          qty: number
          sale_id: string
        }
        Insert: {
          cod: string
          desconto?: number
          desconto_tipo?: string
          id?: string
          nome: string
          preco: number
          product_id: string
          qty: number
          sale_id: string
        }
        Update: {
          cod?: string
          desconto?: number
          desconto_tipo?: string
          id?: string
          nome?: string
          preco?: number
          product_id?: string
          qty?: number
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          data: string | null
          desconto_geral: number
          desconto_geral_tipo: string
          id: string
          pgto: string
          subtotal: number
          total: number
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data?: string | null
          desconto_geral?: number
          desconto_geral_tipo?: string
          id?: string
          pgto: string
          subtotal?: number
          total?: number
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data?: string | null
          desconto_geral?: number
          desconto_geral_tipo?: string
          id?: string
          pgto?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "pendente" | "pago" | "vencido"
      account_type: "pagar" | "receber"
      app_role: "admin" | "funcionario"
      entry_type: "entrada" | "saida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["pendente", "pago", "vencido"],
      account_type: ["pagar", "receber"],
      app_role: ["admin", "funcionario"],
      entry_type: ["entrada", "saida"],
    },
  },
} as const
