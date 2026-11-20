export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          role: 'admin' | 'representative' | 'customer'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          role?: 'admin' | 'representative' | 'customer'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          role?: 'admin' | 'representative' | 'customer'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      representatives: {
        Row: {
          id: string
          user_id: string
          store_name: string
          store_slug: string
          description: string | null
          logo_url: string | null
          cover_url: string | null
          phone: string | null
          location: string | null
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_name: string
          store_slug: string
          description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          phone?: string | null
          location?: string | null
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_name?: string
          store_slug?: string
          description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          phone?: string | null
          location?: string | null
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'representatives_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          representative_id: string
          category_id: string
          name: string
          slug: string
          description: string | null
          price: number
          discount_price: number | null
          stock_quantity: number
          main_image: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          representative_id: string
          category_id: string
          name: string
          slug: string
          description?: string | null
          price: number
          discount_price?: number | null
          stock_quantity?: number
          main_image?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          representative_id?: string
          category_id?: string
          name?: string
          slug?: string
          description?: string | null
          price?: number
          discount_price?: number | null
          stock_quantity?: number
          main_image?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_representative_id_fkey'
            columns: ['representative_id']
            isOneToOne: false
            referencedRelation: 'representatives'
            referencedColumns: ['id']
          }
        ]
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          id?: string
          product_id: string
          image_url: string
          sort_order?: number
        }
        Update: {
          id?: string
          product_id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_name: string
          customer_phone: string
          customer_phone_verified: boolean
          delivery_address: string
          notes: string | null
          subtotal: number
          delivery_fee: number
          total: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_name: string
          customer_phone: string
          customer_phone_verified?: boolean
          delivery_address: string
          notes?: string | null
          subtotal: number
          delivery_fee: number
          total: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_name?: string
          customer_phone?: string
          customer_phone_verified?: boolean
          delivery_address?: string
          notes?: string | null
          subtotal?: number
          delivery_fee?: number
          total?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendor_orders: {
        Row: {
          id: string
          order_id: string
          representative_id: string
          subtotal: number
          delivery_fee: number
          total: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          representative_id: string
          subtotal: number
          delivery_fee: number
          total: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          representative_id?: string
          subtotal?: number
          delivery_fee?: number
          total?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vendor_orders_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendor_orders_representative_id_fkey'
            columns: ['representative_id']
            isOneToOne: false
            referencedRelation: 'representatives'
            referencedColumns: ['id']
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          vendor_order_id: string
          product_id: string
          product_name_snapshot: string
          product_price_snapshot: number
          quantity: number
          total: number
        }
        Insert: {
          id?: string
          vendor_order_id: string
          product_id: string
          product_name_snapshot: string
          product_price_snapshot: number
          quantity: number
          total: number
        }
        Update: {
          id?: string
          vendor_order_id?: string
          product_id?: string
          product_name_snapshot?: string
          product_price_snapshot?: number
          quantity?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_vendor_order_id_fkey'
            columns: ['vendor_order_id']
            isOneToOne: false
            referencedRelation: 'vendor_orders'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      banners: {
        Row: {
          id: string
          title: string
          image_url: string
          target_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          image_url: string
          target_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          image_url?: string
          target_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: string
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          id: string
          vendor_order_id: string
          old_status: string
          new_status: string
          changed_by: string
          created_at: string
        }
        Insert: {
          id?: string
          vendor_order_id: string
          old_status: string
          new_status: string
          changed_by: string
          created_at?: string
        }
        Update: {
          id?: string
          vendor_order_id?: string
          old_status?: string
          new_status?: string
          changed_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_status_history_vendor_order_id_fkey'
            columns: ['vendor_order_id']
            isOneToOne: false
            referencedRelation: 'vendor_orders'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_representative_stats: {
        Args: { rep_id: string }
        Returns: {
          total_products: number
          active_products: number
          total_orders: number
          pending_orders: number
          completed_orders: number
          total_sales: number
        }[]
      }
      create_order: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_delivery_address: string
          p_notes: string | null
          p_cart_items: Json
        }
        Returns: string
      }
      get_vendor_orders: {
        Args: { rep_id: string; p_status?: string; p_page?: number; p_page_size?: number }
        Returns: {
          id: string
          order_id: string
          representative_id: string
          subtotal: number
          delivery_fee: number
          total: number
          status: string
          created_at: string
          order_number: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          items: Json
        }[]
      }
      update_order_status: {
        Args: { p_vendor_order_id: string; p_new_status: string; p_changed_by: string; p_reason?: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'admin' | 'representative' | 'customer'
      order_status: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
      notification_type: 'new_order' | 'order_accepted' | 'order_rejected' | 'order_status_changed' | 'product_approved' | 'product_rejected' | 'admin_announcement' | 'general'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}