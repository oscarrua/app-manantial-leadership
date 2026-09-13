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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      consolidaciones: {
        Row: {
          barrio: string | null
          created_at: string | null
          direccion: string | null
          edad: number | null
          estado: string | null
          estado_civil: string | null
          fecha_visita: string | null
          id: number
          lider_manantial: string | null
          lider_tribu: string | null
          manantial_asignado_id: number | null
          observacion: string | null
          peticion: string | null
          quien_invita: string | null
          registrado_por: string | null
          sexo: string | null
          telefono: string | null
          updated_at: string | null
          visitante: string | null
        }
        Insert: {
          barrio?: string | null
          created_at?: string | null
          direccion?: string | null
          edad?: number | null
          estado?: string | null
          estado_civil?: string | null
          fecha_visita?: string | null
          id?: number
          lider_manantial?: string | null
          lider_tribu?: string | null
          manantial_asignado_id?: number | null
          observacion?: string | null
          peticion?: string | null
          quien_invita?: string | null
          registrado_por?: string | null
          sexo?: string | null
          telefono?: string | null
          updated_at?: string | null
          visitante?: string | null
        }
        Update: {
          barrio?: string | null
          created_at?: string | null
          direccion?: string | null
          edad?: number | null
          estado?: string | null
          estado_civil?: string | null
          fecha_visita?: string | null
          id?: number
          lider_manantial?: string | null
          lider_tribu?: string | null
          manantial_asignado_id?: number | null
          observacion?: string | null
          peticion?: string | null
          quien_invita?: string | null
          registrado_por?: string | null
          sexo?: string | null
          telefono?: string | null
          updated_at?: string | null
          visitante?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consolidaciones_manantial_asignado_id_fkey"
            columns: ["manantial_asignado_id"]
            isOneToOne: false
            referencedRelation: "manantiales"
            referencedColumns: ["id"]
          },
        ]
      }
      gestiones: {
        Row: {
          consolidacion_id: number | null
          created_at: string | null
          fecha_gestion: string | null
          id: number
          resultado: string | null
          tipo_gestion: string | null
          usuario: string | null
        }
        Insert: {
          consolidacion_id?: number | null
          created_at?: string | null
          fecha_gestion?: string | null
          id?: number
          resultado?: string | null
          tipo_gestion?: string | null
          usuario?: string | null
        }
        Update: {
          consolidacion_id?: number | null
          created_at?: string | null
          fecha_gestion?: string | null
          id?: number
          resultado?: string | null
          tipo_gestion?: string | null
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestiones_consolidacion_id_fkey"
            columns: ["consolidacion_id"]
            isOneToOne: false
            referencedRelation: "consolidaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      lideres: {
        Row: {
          created_at: string | null
          estado: boolean
          id: number
          lider_manantial: string | null
          lider_tribu: string | null
          red: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: boolean
          id?: number
          lider_manantial?: string | null
          lider_tribu?: string | null
          red?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: boolean
          id?: number
          lider_manantial?: string | null
          lider_tribu?: string | null
          red?: string | null
        }
        Relationships: []
      }
      manantiales: {
        Row: {
          activo: boolean
          actualizado_por: string | null
          anfitrion: string | null
          barrio: string
          celular_anfitrion: string | null
          celular_lider: string
          dia_reunion: string | null
          direccion: string
          hora_reunion: string | null
          id: number
          latitud: number | null
          lider_id: number
          longitud: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_por?: string | null
          anfitrion?: string | null
          barrio: string
          celular_anfitrion?: string | null
          celular_lider: string
          dia_reunion?: string | null
          direccion: string
          hora_reunion?: string | null
          id?: number
          latitud?: number | null
          lider_id: number
          longitud?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_por?: string | null
          anfitrion?: string | null
          barrio?: string
          celular_anfitrion?: string | null
          celular_lider?: string
          dia_reunion?: string | null
          direccion?: string
          hora_reunion?: string | null
          id?: number
          latitud?: number | null
          lider_id?: number
          longitud?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manantiales_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "lideres"
            referencedColumns: ["id"]
          },
        ]
      }
      roles_usuarios: {
        Row: {
          email: string
          puede_asignar: boolean | null
          puede_cerrar_consolidacion: boolean | null
          puede_crear: boolean | null
          rol: string
        }
        Insert: {
          email: string
          puede_asignar?: boolean | null
          puede_cerrar_consolidacion?: boolean | null
          puede_crear?: boolean | null
          rol?: string
        }
        Update: {
          email?: string
          puede_asignar?: boolean | null
          puede_cerrar_consolidacion?: boolean | null
          puede_crear?: boolean | null
          rol?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
